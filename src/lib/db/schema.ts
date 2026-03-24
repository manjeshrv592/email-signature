import { pgTable, uuid, text, boolean, integer, timestamp, jsonb, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";

// ═══════════════════════════════════════════
// SYNCED FROM M365
// ═══════════════════════════════════════════

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    azureUserId: text("azure_user_id").unique().notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    jobTitle: text("job_title"),
    department: text("department"),
    country: text("country"),
    city: text("city"),
    phone: text("phone"),
    photoUrl: text("photo_url"),
    syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow(),
});

export const groups = pgTable("groups", {
    id: uuid("id").defaultRandom().primaryKey(),
    azureGroupId: text("azure_group_id").unique().notNull(),
    name: text("name").notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow(),
});

export const userGroups = pgTable(
    "user_groups",
    {
        userId: uuid("user_id").references(() => users.id).notNull(),
        groupId: uuid("group_id").references(() => groups.id).notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.userId, table.groupId] }),
    ]
);

// ═══════════════════════════════════════════
// DYNAMIC RESOURCE BUILDER
// ═══════════════════════════════════════════

export const resourceTypes = pgTable("resource_types", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    icon: text("icon"),
    fieldsSchema: jsonb("fields_schema").notNull(),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const resourceItems = pgTable("resource_items", {
    id: uuid("id").defaultRandom().primaryKey(),
    resourceTypeId: uuid("resource_type_id").references(() => resourceTypes.id).notNull(),
    name: text("name").notNull(),
    fieldValues: jsonb("field_values").notNull(),
    isActive: boolean("is_active").default(true),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ═══════════════════════════════════════════
// RULE ENGINE
// ═══════════════════════════════════════════

export const rules = pgTable("rules", {
    id: uuid("id").defaultRandom().primaryKey(),
    resourceItemId: uuid("resource_item_id").references(() => resourceItems.id).notNull(),
    scopeType: text("scope_type").notNull(),
    scopeValue: text("scope_value").notNull(),
    priority: integer("priority").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ═══════════════════════════════════════════
// SIGNATURE TEMPLATES
// ═══════════════════════════════════════════

export const templates = pgTable("templates", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    htmlTemplate: text("html_template").notNull(),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════

export const signatureSettings = pgTable("signature_settings", {
    id: uuid("id").defaultRandom().primaryKey(),
    addToNew: boolean("add_to_new").default(true),
    addToReplies: boolean("add_to_replies").default(false),
    addToForwards: boolean("add_to_forwards").default(true),
    addToCalendar: boolean("add_to_calendar").default(false),
    replyTemplateId: uuid("reply_template_id").references(() => templates.id),
});

// ═══════════════════════════════════════════
// INDIVIDUAL OVERRIDES
// ═══════════════════════════════════════════

export const userOverrides = pgTable("user_overrides", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    overrideItems: jsonb("override_items"),
    customTemplateId: uuid("custom_template_id").references(() => templates.id),
});
