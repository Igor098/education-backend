import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTable1752441243141 implements MigrationInterface {
    name = 'AddUserTable1752441243141'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying(80) NOT NULL, "password" text NOT NULL, "name" character varying(100), "is_active" boolean NOT NULL DEFAULT true, "is_verified" boolean NOT NULL DEFAULT false, "is_blocked" boolean NOT NULL DEFAULT false, "role" "public"."user_role_enum" NOT NULL DEFAULT 'user', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "id_index" ON "user" ("id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "email_index" ON "user" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."email_index"`);
        await queryRunner.query(`DROP INDEX "public"."id_index"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}
