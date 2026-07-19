"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMyOrgRole } from "@/hooks/useMyOrgRole";
import { useCategories } from "@/hooks/useCategories";
import { createCategory, deleteCategory, updateCategory } from "@/lib/firestore";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORY_COLORS } from "@/lib/categoryColors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { CategoryBadge } from "@/components/org/CategoryBadge";
import { XIcon, PlusIcon } from "@/components/ui/Icons";
import type { Category } from "@/types";

interface OrgCategoriesClientProps {
  orgId: string;
}

export function OrgCategoriesClient({ orgId }: OrgCategoriesClientProps) {
  const { member } = useMyOrgRole(orgId);
  const { categories, loading } = useCategories(orgId);
  const t = useTranslations("organizations");

  if (!member) return null;
  const isLeader = member.role === "leader";

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-lg font-bold text-text-primary tracking-tight">
        {t("categoriesTab")}
      </h2>

      {isLeader && <NewCategoryForm orgId={orgId} />}

      {!loading && (
        <div className="space-y-1">
          {categories.length === 0 ? (
            <p className="text-text-muted text-sm">{t("categoriesEmpty")}</p>
          ) : (
            categories.map((category) => (
              <CategoryRow key={category.id} orgId={orgId} category={category} canManage={isLeader} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function NewCategoryForm({ orgId }: { orgId: string }) {
  const { user } = useAuth();
  const t = useTranslations("organizations");
  const [title, setTitle] = useState("");
  const [colorId, setColorId] = useState(CATEGORY_COLORS[0].id);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setSubmitting(true);
    try {
      await createCategory(orgId, { title: title.trim(), colorId, createdBy: user.uid });
      setTitle("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-lg p-4 space-y-4">
      <Field label={t("newCategory")}>
        <Input
          type="text"
          placeholder={t("categoryTitlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>

      <div>
        <p className="text-text-muted text-xs font-medium mb-2">{t("pickColor")}</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => setColorId(color.id)}
              aria-label={color.id}
              className={`size-7 rounded-full ${color.dot} transition-transform cursor-pointer ${
                colorId === color.id ? "ring-2 ring-offset-2 ring-offset-bg-card ring-text-primary scale-105" : ""
              }`}
            />
          ))}
        </div>
      </div>

      <Button type="submit" size="sm" disabled={submitting || !title.trim()}>
        <PlusIcon size={12} />
        {t("newCategory")}
      </Button>
    </form>
  );
}

function CategoryRow({
  orgId,
  category,
  canManage,
}: {
  orgId: string;
  category: Category;
  canManage: boolean;
}) {
  const t = useTranslations("organizations");
  const [editingTitle, setEditingTitle] = useState(category.title);
  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState(false);

  const handleRename = async () => {
    if (!editingTitle.trim() || editingTitle === category.title) {
      setEditing(false);
      return;
    }
    setWorking(true);
    try {
      await updateCategory(orgId, category.id, { title: editingTitle.trim(), colorId: category.colorId });
    } finally {
      setWorking(false);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    setWorking(true);
    await deleteCategory(orgId, category.id);
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-bg-elevated transition-colors">
      {editing ? (
        <Input
          autoFocus
          size="sm"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => e.key === "Enter" && handleRename()}
          className="flex-1"
        />
      ) : (
        <button
          type="button"
          disabled={!canManage}
          onClick={() => canManage && setEditing(true)}
          className="flex-1 text-left"
        >
          <CategoryBadge title={category.title} colorId={category.colorId} />
        </button>
      )}

      {canManage && !editing && (
        <button
          onClick={handleDelete}
          disabled={working}
          aria-label={t("deleteCategoryConfirm")}
          className="size-6 flex items-center justify-center rounded cursor-pointer text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
        >
          <XIcon size={12} />
        </button>
      )}
    </div>
  );
}
