import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { AdminShell } from "../_components/admin-shell";
import { ToolsForm } from "./tools-form";

export const runtime = "nodejs";

export default async function AdminToolsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const tools = await getRepo().listTools(true);
  return (
    <AdminShell admin={admin}>
      <h1 className="text-3xl font-bold">AI toolkit configuration</h1>
      <p className="mt-2 text-muted-foreground">
        Changes are stored in MongoDB and immediately update the public and team toolkits.
      </p>
      <ToolsForm tools={tools} />
      <div className="panel mt-6 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Order", "Name", "Category", "Enabled", "Recommended", "Website"].map((heading) => (
                <th className="px-4 py-3" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tools.map((tool) => (
              <tr key={tool.id}>
                <td className="px-4 py-3">{tool.order}</td>
                <td className="px-4 py-3 font-semibold">{tool.name}</td>
                <td className="px-4 py-3">{tool.category}</td>
                <td className="px-4 py-3">{tool.enabled ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{tool.recommended ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <a
                    className="text-primary underline"
                    href={tool.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
