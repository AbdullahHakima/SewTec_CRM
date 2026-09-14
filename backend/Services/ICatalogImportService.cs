using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Services;

public interface ICatalogImportService
{
    Task<CatalogImportResult> ImportCatalogFromStreamAsync(Stream stream, string fileName, bool replaceAll = false);
    Task<PriceImportResult> ImportPricesFromStreamAsync(Stream stream, string fileName);
    Task<CatalogImportResult> SeedFromDiskFileAsync(string filePath, bool replaceAll = false);
    byte[] GenerateCatalogTemplateCsv();
    byte[] GeneratePricesTemplateCsv();
    byte[] ExportCatalogCsv(List<Product> products);
}

