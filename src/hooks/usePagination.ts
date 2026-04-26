import { useState } from "react";

export const usePagination = () => {
  //States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  return {
    currentPage,
    setCurrentPage,
    totalItems,
    setTotalItems,
    totalPages,
    setTotalPages,
    itemsPerPage,
    setItemsPerPage,
  };
};
