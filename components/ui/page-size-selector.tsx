import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSizeSelectorProps } from "@/app/(product)/orders/models/types";

export function PageSizeSelector({ 
  pageSize, 
  onPageSizeChange, 
  options = [10, 20, 50, 100] 
}: PageSizeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Show:</span>
      <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option.toString()}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 