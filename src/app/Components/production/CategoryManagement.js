import React, { useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import { PencilSquare, TagsFill, TrashFill } from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import { selectRoles } from "../../auth/authSlice";
import {
  selectCategories,
  useAddCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from "../../features/api/categorySlice";
import { selectStock } from "../../features/stock/stockSlice";

const EMPTY_ARRAY = [];

const normalize = (value) => String(value || "").trim();

export default function CategoryManagement({ context = "products" }) {
  useGetCategoriesQuery();

  const roles = useSelector(selectRoles) ?? EMPTY_ARRAY;
  const categories = useSelector(selectCategories) ?? EMPTY_ARRAY;
  const products = useSelector(selectStock) ?? EMPTY_ARRAY;
  const isAdmin = roles.includes("admin") || roles.includes("superadmin");

  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [addCategory, { isLoading: isCreating }] = useAddCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const productCounts = useMemo(() => {
    return products.reduce((map, product) => {
      const categoryId = String(product.itemCategoryId || "");
      map[categoryId] = (map[categoryId] || 0) + 1;
      return map;
    }, {});
  }, [products]);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) =>
        String(a.categoryName || "").localeCompare(String(b.categoryName || ""))
      ),
    [categories]
  );

  const resetForm = () => {
    setCategoryName("");
    setEditingCategory(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = normalize(categoryName);

    if (name.length < 3) {
      toast.warning("Category name should be at least 3 characters.");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory({
          category_id: editingCategory.categoryId,
          category_name: name,
        }).unwrap();
        toast.success("Category updated successfully.");
      } else {
        await addCategory({ category_name: name }).unwrap();
        toast.success("Category created successfully.");
      }
      resetForm();
    } catch (error) {
      toast.error(error?.data?.message || error?.error || "Category could not be saved.");
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.categoryName || "");
  };

  const handleDelete = async (category) => {
    const usageCount = productCounts[String(category.categoryId)] || 0;
    if (usageCount > 0) {
      toast.warning("Move products out of this category before deleting it.");
      return;
    }

    try {
      await deleteCategory({ category_id: category.categoryId }).unwrap();
      toast.success("Category deleted successfully.");
      if (editingCategory?.categoryId === category.categoryId) {
        resetForm();
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.error || "Category could not be deleted.");
    }
  };

  if (!isAdmin) {
    return (
      <Alert variant="light" className="mb-0">
        Category management is currently available to administrators only.
      </Alert>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <TagsFill />
              <h5 className="mb-0">Category Management</h5>
            </div>
            <p className="text-muted mb-0">
              Create and maintain categories used by {context === "production" ? "production items" : "products"}.
            </p>
          </div>
          <Badge bg="success" className="align-self-start">
            Admin only
          </Badge>
        </div>

        <Row className="g-4">
          <Col lg={4}>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Category Name</Form.Label>
                <Form.Control
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="e.g., Packaging"
                  maxLength={40}
                  required
                />
              </Form.Group>
              <div className="d-grid gap-2">
                <Button type="submit" variant="success" disabled={isCreating || isUpdating}>
                  {editingCategory
                    ? isUpdating
                      ? "Updating..."
                      : "Update Category"
                    : isCreating
                      ? "Creating..."
                      : "Create Category"}
                </Button>
                {editingCategory ? (
                  <Button type="button" variant="light" onClick={resetForm}>
                    Cancel Edit
                  </Button>
                ) : null}
              </div>
            </Form>
          </Col>

          <Col lg={8}>
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Products</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCategories.map((category) => {
                    const usageCount = productCounts[String(category.categoryId)] || 0;

                    return (
                      <tr key={category.categoryId}>
                        <td className="fw-semibold">{category.categoryName}</td>
                        <td>{usageCount}</td>
                        <td className="text-end">
                          <Button
                            variant="light"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(category)}
                          >
                            <PencilSquare />
                          </Button>
                          <Button
                            variant="light"
                            size="sm"
                            className="text-danger"
                            disabled={isDeleting || usageCount > 0}
                            onClick={() => handleDelete(category)}
                          >
                            <TrashFill />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            {!sortedCategories.length ? (
              <Alert variant="info" className="mt-3 mb-0">
                No categories have been created yet.
              </Alert>
            ) : null}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
