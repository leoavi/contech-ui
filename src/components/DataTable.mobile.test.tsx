import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DataTable, type DataTableColumn } from "./DataTable";

afterEach(cleanup);

describe("controles mobile da DataTable", () => {
  it("mantém ordenação, filtro e rolagem horizontal acessíveis ao toque", () => {
    const columns: DataTableColumn<{ id: string; name: string }>[] = [
      {
        accessorKey: "name",
        header: "Nome",
        enableSorting: true,
        filter: "text",
      },
    ];

    const { container } = render(
      <DataTable
        data={[{ id: "1", name: "Ana" }]}
        columns={columns}
        rowKey={(row) => row.id}
      />,
    );

    expect(screen.getByRole("button", { name: /Nome/ }).classList).toContain("min-h-11");
    expect(screen.getByTitle("Filtrar coluna").classList).toContain("min-w-11");
    expect(container.querySelector(".overflow-x-auto")).toBeTruthy();
  });
});
