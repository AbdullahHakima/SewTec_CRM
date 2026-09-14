from contextlib import closing
import pathlib
import sqlite3
import tempfile
import unittest
from reviewed_customer_merge import merge, RELATED


class MergeSafetyTests(unittest.TestCase):
    def test_review_preserves_history_and_backup_restores(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "isolated.db"
            with closing(sqlite3.connect(path)) as db, db:
                db.execute("CREATE TABLE Customers (Id TEXT PRIMARY KEY, Name TEXT, Phone TEXT, PhoneSecondary TEXT, BranchId TEXT, AssignedRepId TEXT, AssignedRepName TEXT, LifetimeSales TEXT, OpenPipelineValue TEXT, LastContactAt TEXT, NextFollowUpAt TEXT, IsVip INTEGER, Notes TEXT)")
                for customer in ("a", "b"):
                    db.execute("INSERT INTO Customers VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", (customer, customer, "01011111111", None, "branch", "rep", "Rep", "0.10", "0.20", "2026-01-01", None, 0, "Original notes " + customer))
                for table in RELATED:
                    db.execute(f'CREATE TABLE "{table}" (Id TEXT PRIMARY KEY, CustomerId TEXT REFERENCES Customers(Id), Status TEXT, ScheduledAt TEXT)')
                    for customer in ("a", "b"):
                        db.execute(f'INSERT INTO "{table}" VALUES (?,?,?,?)', (customer, customer, "Scheduled", "2026-09-15"))
            proposal = merge(path, "a", "b")
            with self.assertRaises(ValueError):
                merge(path, "a", "b", "reviewer", "duplicate", "incorrect-token")
            result = merge(path, "a", "b", "reviewer", "Reviewed duplicate", proposal["reviewToken"])
            with closing(sqlite3.connect(path)) as db, db:
                self.assertEqual(db.execute("SELECT count(*) FROM Customers").fetchone()[0], 1)
                self.assertEqual(db.execute("SELECT LifetimeSales FROM Customers").fetchone()[0], "0.20")
                for table in RELATED:
                    self.assertEqual(db.execute(f'SELECT count(*) FROM "{table}" WHERE CustomerId="b"').fetchone()[0], 2)
                self.assertIn("Original notes a", db.execute("SELECT SnapshotJson FROM OperatorCustomerMergeAudit").fetchone()[0])
            restored = pathlib.Path(directory) / "restored.db"
            with closing(sqlite3.connect(result["backup"])) as backup, closing(sqlite3.connect(restored)) as target:
                backup.backup(target)
                self.assertEqual(target.execute("PRAGMA integrity_check").fetchone()[0], "ok")
                self.assertEqual(target.execute("SELECT count(*) FROM Customers").fetchone()[0], 2)


if __name__ == "__main__":
    unittest.main()
