import { getTemplate, getAvailablePlaceholders } from "../../actions";
import { notFound } from "next/navigation";
import TemplateForm from "../../TemplateForm";

interface EditTemplatePageProps {
    params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
    const { id } = await params;
    const [template, placeholders] = await Promise.all([
        getTemplate(id),
        getAvailablePlaceholders(),
    ]);

    if (!template) notFound();

    return (
        <TemplateForm
            mode="edit"
            templateId={id}
            initialData={{
                name: template.name,
                htmlTemplate: template.htmlTemplate,
                isDefault: template.isDefault ?? false,
            }}
            placeholders={placeholders}
        />
    );
}
