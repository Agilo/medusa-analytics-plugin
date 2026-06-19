import { Input as MedusaInput } from '@medusajs/ui';

export const Input: React.FC<
  React.ComponentProps<typeof MedusaInput> & {
    error?: string;
  }
> = ({ error, ...rest }) => {
  return (
    <div className="flex flex-col">
      <MedusaInput {...rest} />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
