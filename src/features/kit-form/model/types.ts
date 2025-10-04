export interface KitFormData {
  id?: string;
  name: string;
  description: string;
  parent?: string;
  color: string;
}

export interface KitFormProps {
  initialData?: KitFormData;
  onSubmit: (data: KitFormData) => Promise<void>;
}

export interface ListOption {
  id: string;
  title: string;
  value: string;
}
