START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012100401_AddSiteDocumentHistory') THEN
    CREATE TABLE site_document_versions (
        "DocumentKey" character varying(30) NOT NULL,
        "Revision" bigint NOT NULL,
        "Action" character varying(30) NOT NULL,
        "Actor" character varying(255) NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "DataJson" jsonb NOT NULL,
        CONSTRAINT "PK_site_document_versions" PRIMARY KEY ("DocumentKey", "Revision")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012100401_AddSiteDocumentHistory') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261012100401_AddSiteDocumentHistory', '9.0.2');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012101212_AddMediaLibrary') THEN
    CREATE TABLE media_assets (
        "Id" uuid NOT NULL,
        "ObjectKey" character varying(100) NOT NULL,
        "Url" character varying(2048) NOT NULL,
        "OriginalName" character varying(200) NOT NULL,
        "ContentType" character varying(100) NOT NULL,
        "Sha256" character varying(64) NOT NULL,
        "Size" bigint NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "Actor" character varying(255) NOT NULL,
        "Archived" boolean NOT NULL,
        CONSTRAINT "PK_media_assets" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012101212_AddMediaLibrary') THEN
    CREATE INDEX "IX_media_assets_CreatedAtUtc_Id" ON media_assets ("CreatedAtUtc", "Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012101212_AddMediaLibrary') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261012101212_AddMediaLibrary', '9.0.2');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012102121_AddInquiryNotesAndReplies') THEN
    ALTER TABLE inquiries ADD "AdminNotes" character varying(10000) NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012102121_AddInquiryNotesAndReplies') THEN
    ALTER TABLE inquiries ADD "NotesUpdatedBy" character varying(255);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012102121_AddInquiryNotesAndReplies') THEN
    CREATE TABLE inquiry_replies (
        "Id" uuid NOT NULL,
        "InquiryId" uuid NOT NULL,
        "Subject" character varying(200) NOT NULL,
        "Body" character varying(10000) NOT NULL,
        "Actor" character varying(255) NOT NULL,
        "Status" character varying(30) NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "CompletedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_inquiry_replies" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_inquiry_replies_inquiries_InquiryId" FOREIGN KEY ("InquiryId") REFERENCES inquiries ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012102121_AddInquiryNotesAndReplies') THEN
    CREATE INDEX "IX_inquiry_replies_InquiryId_CreatedAtUtc_Id" ON inquiry_replies ("InquiryId", "CreatedAtUtc", "Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261012102121_AddInquiryNotesAndReplies') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261012102121_AddInquiryNotesAndReplies', '9.0.2');
    END IF;
END $EF$;
COMMIT;

