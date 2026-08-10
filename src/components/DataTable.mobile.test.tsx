import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

    const sortButton = screen.getByRole("button", { name: /Nome/ });
    expect(sortButton.classList).toContain("min-h-11");
    expect(sortButton.classList).toContain("min-w-11");
    expect(sortButton.classList).toContain("md:min-h-0");
    expect(sortButton.classList).toContain("md:min-w-0");
    const filterButton = screen.getByTitle("Filtrar coluna");
    expect(filterButton.classList).toContain("min-h-11");
    expect(filterButton.classList).toContain("min-w-11");
    expect(filterButton.classList).toContain("md:min-h-0");
    expect(filterButton.classList).toContain("md:min-w-0");
    expect(container.querySelector(".overflow-x-auto")).toBeTruthy();

    fireEvent.click(filterButton);
    const input = screen.getByPlaceholderText("Filtrar...");
    expect(input.classList).toContain("min-h-11");
    expect(input.classList).toContain("text-base");
    expect(input.classList).toContain("md:min-h-0");
    expect(input.classList).toContain("md:text-xs");
    fireEvent.change(input, { target: { value: "Ana" } });
    const clear = screen.getByRole("button", { name: "Limpar filtro" });
    expect(clear.classList).toContain("min-h-11");
    expect(clear.classList).toContain("md:min-h-0");
    fireEvent.click(clear);
  });
});
