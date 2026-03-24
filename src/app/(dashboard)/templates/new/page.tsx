import { getAvailablePlaceholders } from "../actions";
import TemplateForm from "../TemplateForm";

export default async function NewTemplatePage() {
    const placeholders = await getAvailablePlaceholders();

    return <TemplateForm mode="create" placeholders={placeholders} />;
}
