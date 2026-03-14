import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DataColumn, DataRow } from "@/lib/mock-data";

type DataTableCardProps = {
  title: string;
  description: string;
  columns: DataColumn[];
  rows: DataRow[];
};

function renderCell(key: string, value: string) {
  if (key === "status") {
    return <Badge variant="outline">{value}</Badge>;
  }

  if (key === "priority") {
    return <Badge>{value}</Badge>;
  }

  return value;
}

export function DataTableCard({
  title,
  description,
  columns,
  rows,
}: DataTableCardProps) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-4 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Queue snapshot
            </p>
            <CardTitle className="text-lg tracking-tight text-slate-950">
              {title}
            </CardTitle>
            <CardDescription className="max-w-xl text-sm leading-relaxed text-slate-600">
              {description}
            </CardDescription>
          </div>

          <Badge variant="secondary">{rows.length} rows</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${title}-${index}`}>
                {columns.map((column) => (
                  <TableCell
                    key={`${title}-${index}-${column.key}`}
                    className="text-slate-700"
                  >
                    {renderCell(column.key, row[column.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
