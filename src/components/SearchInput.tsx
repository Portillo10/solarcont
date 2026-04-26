import { FC, useState } from "react";

type SearchInputProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
};
const SearchInput: FC<SearchInputProps> = ({
  onSearch,
  placeholder = "Buscar producto...",
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <input
      value={searchTerm}
      onChange={(e) => {
        const search = e.target.value;
        setSearchTerm(search);
        onSearch(search);
      }}
      type="text"
      placeholder={placeholder}
      className="w-full max-w-xl px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1"
    />
  );
};

export default SearchInput;
