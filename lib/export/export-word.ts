import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { formatExportCell } from "./formatters";
import { buildExportFilename, downloadBinary } from "./filenames";
import type { ExportColumn, ExportDataset } from "./types";

const MAX_DOCX_ROWS = 1000;

function metaParagraphs(dataset: ExportDataset): Paragraph[] {
  const items = [
    ["Restaurant", dataset.meta.restaurantName ?? "—"],
    ["Date range", dataset.meta.dateRangeLabel ?? "—"],
    [
      "Generated",
      formatExportCell(dataset.meta.generatedAt ?? new Date(), "datetime"),
    ],
    dataset.meta.filterSummary?.length
      ? ["Filters", dataset.meta.filterSummary.join("; ")]
      : null,
  ].filter(Boolean) as [string, string][];

  return items.map(
    ([label, value]) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true }),
          new TextRun(value),
        ],
      }),
  );
}

function buildTable(columns: ExportColumn[], rows: Record<string, unknown>[]): Table {
  const headerRow = new TableRow({
    children: columns.map(
      (col) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: col.header, bold: true })] })],
        }),
    ),
  });

  const dataRows =
    rows.length > 0
      ? rows.map(
          (row) =>
            new TableRow({
              children: columns.map(
                (col) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun(
                            formatExportCell(row[col.key], col.type ?? "string"),
                          ),
                        ],
                      }),
                    ],
                  }),
              ),
            }),
        )
      : [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: columns.length,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun("No records match the current filters."),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

export async function exportDatasetDocx(dataset: ExportDataset): Promise<void> {
  const rows = dataset.rows.slice(0, MAX_DOCX_ROWS);
  const truncated = dataset.rows.length > MAX_DOCX_ROWS;

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: "Al Jamali QR",
      heading: HeadingLevel.HEADING_3,
    }),
    new Paragraph({
      text: dataset.meta.title,
      heading: HeadingLevel.HEADING_1,
    }),
    ...metaParagraphs(dataset),
  ];

  if (dataset.summary?.length) {
    children.push(
      new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }),
    );
    for (const item of dataset.summary) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${item.label}: `, bold: true }),
            new TextRun(item.value),
          ],
        }),
      );
    }
  }

  children.push(buildTable(dataset.columns, rows));

  if (truncated) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Showing first ${MAX_DOCX_ROWS} of ${dataset.rows.length} records. Use Excel or CSV for the full filtered dataset.`,
            italics: true,
          }),
        ],
      }),
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buffer = await Packer.toBlob(doc);
  downloadBinary(
    buildExportFilename(dataset.filenamePrefix, "docx", {
      dateRangeLabel: dataset.meta.dateRangeLabel,
    }),
    buffer,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
}

export async function exportEmptyDatasetDocx(dataset: ExportDataset): Promise<void> {
  await exportDatasetDocx({
    ...dataset,
    rows: [],
    summary: [{ label: "Records", value: "No records match the current filters." }],
  });
}
