CREATE TABLE "company_agent_signup_request_history" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "contact_type" VARCHAR(10) NOT NULL,
    "contact" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_agent_signup_request_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "company_agent_signup_request_history_company_id_created_at_idx"
    ON "company_agent_signup_request_history"("company_id", "created_at");

ALTER TABLE "company_agent_signup_request_history"
    ADD CONSTRAINT "company_agent_signup_request_history_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "company"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
