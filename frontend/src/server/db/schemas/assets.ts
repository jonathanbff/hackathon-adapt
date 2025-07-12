import { pgTable, uuid, varchar, text, timestamp, integer, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  _clerk: varchar("_clerk", { length: 255 }).notNull(),
  url: text("url").notNull(),
  pathname: varchar("pathname", { length: 500 }).notNull(),
  contentType: varchar("content_type", { length: 255 }),
  size: integer("size"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assetsImages = pgTable("assets_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  _clerk: varchar("_clerk", { length: 255 }).notNull(),
  _asset: uuid("_asset").references(() => assets.id, { onDelete: "cascade" }).notNull(),
  alt: varchar("alt", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pdfPageImages = pgTable("pdf_page_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  _pdf_assets: varchar("_pdf_assets", { length: 255 }).notNull(),
  _image_asset: uuid("_image_asset").references(() => assetsImages.id, { onDelete: "cascade" }).notNull(),
  page_number: integer("page_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  _clerk: varchar("_clerk", { length: 255 }).notNull(),
  _asset: uuid("_asset").references(() => assets.id, { onDelete: "cascade" }).notNull(),
  filename: varchar("filename", { length: 500 }).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  processingStatus: varchar("processing_status", { length: 50 }).default("pending").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assetsRelations = relations(assets, ({ many }) => ({
  images: many(assetsImages),
  documents: many(documents),
}));

export const assetsImagesRelations = relations(assetsImages, ({ one, many }) => ({
  asset: one(assets, {
    fields: [assetsImages._asset],
    references: [assets.id],
  }),
  pdfPageImages: many(pdfPageImages),
}));

export const pdfPageImagesRelations = relations(pdfPageImages, ({ one }) => ({
  imageAsset: one(assetsImages, {
    fields: [pdfPageImages._image_asset],
    references: [assetsImages.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  asset: one(assets, {
    fields: [documents._asset],
    references: [assets.id],
  }),
}));

export const insertAssetSchema = createInsertSchema(assets);
export const selectAssetSchema = createSelectSchema(assets);
export const insertAssetImageSchema = createInsertSchema(assetsImages);
export const selectAssetImageSchema = createSelectSchema(assetsImages);
export const insertPdfPageImageSchema = createInsertSchema(pdfPageImages);
export const selectPdfPageImageSchema = createSelectSchema(pdfPageImages);
export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type AssetImage = typeof assetsImages.$inferSelect;
export type NewAssetImage = typeof assetsImages.$inferInsert;
export type PdfPageImage = typeof pdfPageImages.$inferSelect;
export type NewPdfPageImage = typeof pdfPageImages.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert; 