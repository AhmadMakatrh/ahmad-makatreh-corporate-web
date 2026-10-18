CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260905174950_InitialCreate') THEN
    CREATE TABLE inquiries (
        "Id" uuid NOT NULL,
        "ReferenceId" character varying(50) NOT NULL,
        "Name" character varying(100) NOT NULL,
        "Email" character varying(255) NOT NULL,
        "ProjectDetails" character varying(4000) NOT NULL,
        "Status" character varying(30) NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_inquiries" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260905174950_InitialCreate') THEN
    CREATE UNIQUE INDEX ix_inquiries_reference_id ON inquiries ("ReferenceId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260905174950_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260905174950_InitialCreate', '9.0.2');
    END IF;
END $EF$;
COMMIT;

