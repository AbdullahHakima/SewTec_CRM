"""Offline, explicitly reviewed customer merge. Defaults to a read-only proposal.
Run against a validated copy first; stop the application before --apply.
The SHA-256 review token binds approval to every affected record.
"""
from contextlib import closing
import argparse
import datetime
import hashlib
import json
import pathlib
import sqlite3
import uuid
from decimal import Decimal

RELATED = ("InstalledMachines", "Opportunities", "FollowUps", "Interactions", "Activities")


def normalize(value):
    digits = "".join(str(int(c)) for c in (value or "") if c.isdecimal())
    if digits.startswith("0020"):
        digits = digits[4:]
    elif digits.startswith("20"):
        digits = digits[2:]
    if len(digits) == 10:
        digits = "0" + digits
    if len(digits) != 11 or digits[:3] not in ("010", "011", "012", "015"):
        raise ValueError("Invalid Egyptian mobile identity; correct it through reviewed data repair first.")
    return digits


def snapshot(db, source, target):
    result = {"customers": [dict(row) for row in db.execute("SELECT * FROM Customers WHERE Id IN (?,?) ORDER BY Id", (source, target))]}
    if source == target or len(result["customers"]) != 2:
        raise ValueError("Select two distinct existing customer IDs.")
    for table in RELATED:
        result[table] = [dict(row) for row in db.execute(f'SELECT * FROM "{table}" WHERE CustomerId IN (?,?) ORDER BY Id', (source, target))]
    return result


def merge(path, source, target, reviewer=None, reason=None, approval=None):
    path = pathlib.Path(path).resolve(strict=True)
    db = sqlite3.connect(path.as_uri() + ("?mode=rw" if approval else "?mode=ro"), uri=True)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    try:
        if approval:
            db.execute("BEGIN IMMEDIATE")
        before = snapshot(db, source, target)
        payload = json.dumps(before, sort_keys=True, ensure_ascii=False)
        token = hashlib.sha256((source + "\n" + target + "\n" + payload).encode()).hexdigest()
        proposal = {"sourceId": source, "targetId": target, "reviewToken": token,
                    "counts": {table: len(before[table]) for table in RELATED}}
        if not approval:
            return proposal
        if approval != token or not reviewer or not reason:
            raise ValueError("A current review token, reviewer and reason are required. No changes applied.")
        customers = {c["Id"]: c for c in before["customers"]}
        destination = customers[target]
        if customers[source]["BranchId"] != destination["BranchId"]:
            raise ValueError("Cross-branch merges require a separate reviewed ownership transfer; no visibility is expanded by this tool.")
        phones = list(dict.fromkeys(normalize(c[field]) for c in (destination, customers[source]) for field in ("Phone", "PhoneSecondary") if c[field]))
        if len(phones) > 2:
            raise ValueError("More than two distinct phones: review canonical phone fields before merging. No number is silently discarded.")
        # Backup a separate read connection, so the backup never waits on our write transaction.
        backup_path = str(path) + ".merge-" + uuid.uuid4().hex + ".bak"
        with closing(sqlite3.connect(path.as_uri() + "?mode=ro", uri=True)) as reader, closing(sqlite3.connect(backup_path)) as backup:
            reader.backup(backup)
        db.execute("CREATE TABLE IF NOT EXISTS OperatorCustomerMergeAudit (Id TEXT PRIMARY KEY, OccurredAt TEXT NOT NULL, Reviewer TEXT NOT NULL, Reason TEXT NOT NULL, SourceId TEXT NOT NULL, TargetId TEXT NOT NULL, SnapshotJson TEXT NOT NULL)")
        db.execute("INSERT INTO OperatorCustomerMergeAudit VALUES (?,?,?,?,?,?,?)", (uuid.uuid4().hex, datetime.datetime.now(datetime.timezone.utc).isoformat(), reviewer, reason, source, target, payload))
        for table in RELATED:
            columns = {r["name"] for r in db.execute(f'PRAGMA table_info("{table}")')}
            changes = {"CustomerId": target}
            for column, value in (("CustomerName", destination["Name"]), ("CustomerPhone", phones[0]), ("BranchId", destination["BranchId"]), ("AssignedRepId", destination["AssignedRepId"]), ("AssignedRepName", destination["AssignedRepName"])):
                if column in columns:
                    changes[column] = value
            if "Revision" in columns:
                changes["Revision"] = uuid.uuid4().hex
            assignments = ",".join(f'"{key}"=?' for key in changes)
            db.execute(f'UPDATE "{table}" SET {assignments} WHERE CustomerId IN (?,?)', (*changes.values(), source, target))
        identity_table = db.execute("SELECT 1 FROM sqlite_master WHERE name='CustomerPhones'").fetchone()
        if identity_table:
            db.execute("DELETE FROM CustomerPhones WHERE CustomerId IN (?,?)", (source, target))
            for phone in phones:
                db.execute("INSERT INTO CustomerPhones (NormalizedPhone,CustomerId) VALUES (?,?)", (phone, target))
        updates = {"Phone": phones[0], "PhoneSecondary": phones[1] if len(phones) > 1 else None,
                   "LifetimeSales": str(sum(Decimal(str(c["LifetimeSales"])) for c in customers.values())),
                   "OpenPipelineValue": str(sum(Decimal(str(c["OpenPipelineValue"])) for c in customers.values())),
                   "LastContactAt": max(c["LastContactAt"] for c in customers.values()),
                   "IsVip": max(c["IsVip"] for c in customers.values())}
        updates["NextFollowUpAt"] = db.execute("SELECT MIN(ScheduledAt) FROM FollowUps WHERE CustomerId=? AND lower(Status)='scheduled'", (target,)).fetchone()[0]
        if "Revision" in destination:
            updates["Revision"] = uuid.uuid4().hex
        db.execute("UPDATE Customers SET " + ",".join(f'"{key}"=?' for key in updates) + " WHERE Id=?", (*updates.values(), target))
        db.execute("DELETE FROM Customers WHERE Id=?", (source,))
        for table in RELATED:
            if db.execute(f'SELECT COUNT(*) FROM "{table}" WHERE CustomerId=?', (target,)).fetchone()[0] != len(before[table]):
                raise ValueError("Related-record reconciliation failed; rolling back.")
        if db.execute("PRAGMA foreign_key_check").fetchone() or db.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise ValueError("Integrity validation failed; rolling back.")
        db.commit()
        return {**proposal, "applied": True, "backup": backup_path}
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database"); parser.add_argument("source"); parser.add_argument("target")
    parser.add_argument("--apply", metavar="REVIEW_TOKEN")
    parser.add_argument("--reviewer"); parser.add_argument("--reason")
    args = parser.parse_args()
    print(json.dumps(merge(args.database, args.source, args.target, args.reviewer, args.reason, args.apply), indent=2))
