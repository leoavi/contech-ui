import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Input } from "./Input";
import { MainContent } from "./MainContent";
import { PageHeader } from "./PageHeader";
import { Section } from "./Section";
import { Select } from "./Select";
import { Textarea } from "./Textarea";

afterEach(cleanup);

describe("contrato mobile dos headers", () => {
  it("PageHeader declara empilhamento mobile sem forcar wrap no desktop", () => {
    const longToken = "tokensuperlongosemespacosquenaopodevazardocontainer";
    const { container } = render(
      <PageHeader
        area={longToken}
        title={longToken}
        description={longToken}
        extra={<div className="flex"><button>Ação A</button><button>Ação B</button></div>}
      />,
    );
    const header = container.querySelector("header")!;
    expect(header.classList).toContain("flex-col");
    expect(header.classList).toContain("md:flex-row");
    const headerTexts = screen.getAllByText(longToken);
    expect(headerTexts).toHaveLength(3);
    headerTexts.forEach((text) => expect(text.classList).toContain("break-words"));
    const extra = screen.getByRole("button", { name: "Ação A" }).parentElement?.parentElement;
    expect(extra?.classList).toContain("w-full");
    expect(extra?.className).toContain("max-md:[&>*]:flex-wrap");
    expect(extra?.classList).not.toContain("[&>*]:flex-wrap");
    expect(extra?.className).not.toContain("md:[&>*]:flex-nowrap");
  });

  it("Section empilha acao no mobile", () => {
    const longToken = "tokensuperlongosemespacosquenaopodevazardocontainer";
    const { container } = render(<Section title={longToken} description={longToken} action={<button>Ação</button>}>x</Section>);
    const header = container.querySelector("section > div")!;
    expect(header.classList).toContain("flex-col");
    expect(header.classList).toContain("md:flex-row");
    expect(screen.getByText(longToken, { selector: "h2" }).classList).toContain("break-words");
    expect(screen.getByText(longToken, { selector: "p" }).classList).toContain("break-words");
    expect(screen.getByText(longToken, { selector: "h2" }).parentElement?.classList).toContain("min-w-0");
  });
});

describe.each([
  ["input", <Input aria-label="input" />],
  ["select", <Select aria-label="select"><option>x</option></Select>],
  ["textarea", <Textarea aria-label="textarea" />],
])("contrato mobile de %s", (name, control) => {
  it("declara o contrato de classes para mobile", () => {
    render(control);
    const role = name === "textarea" ? "textbox" : name === "select" ? "combobox" : "textbox";
    const el = screen.getByRole(role);
    for (const token of ["min-w-0", "max-w-full", "text-base", "md:text-sm"]) {
      expect(el.classList).toContain(token);
    }
    if (name !== "textarea") expect(el.classList).toContain("min-h-11");
  });
});

it("MainContent contém o documento sem recortar scrollers internos", () => {
  const { container } = render(<MainContent hasSidebar={false}>conteúdo</MainContent>);
  const main = container.querySelector("main")!;

  for (const token of ["min-w-0", "max-w-full", "overflow-x-clip"]) {
    expect(main.classList).toContain(token);
  }
  expect(main.firstElementChild?.classList).toContain("min-w-0");
});
