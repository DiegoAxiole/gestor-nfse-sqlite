CREATE TABLE `agendamentos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant_id` integer NOT NULL,
	`prestador_cnpj` text(14),
	`tipo` text(30) DEFAULT 'consulta_distribuicao',
	`intervalo_minutos` integer DEFAULT 60,
	`ativo` integer DEFAULT true,
	`ultima_execucao` text,
	`proxima_execucao` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `asaas_webhooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event` text(100) NOT NULL,
	`asaas_id` text(100),
	`subscription_id` integer,
	`raw_body` text,
	`processed_at` text NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `automacao_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant_id` integer NOT NULL,
	`prestador_cnpj` text(14),
	`tipo` text(30) DEFAULT '',
	`mensagem` text DEFAULT '',
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `background_tasks` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`tenant_id` integer NOT NULL,
	`tipo` text(50) DEFAULT '',
	`chave_acesso` text(50),
	`cnpj` text(14),
	`status` text(20) DEFAULT 'pending',
	`progresso` integer DEFAULT 0,
	`mensagem` text DEFAULT '',
	`resultado_json` text,
	`erro_texto` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `configuracoes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant_id` integer NOT NULL,
	`ambiente` text(20) DEFAULT 'Homologacao',
	`codigo_municipio` integer DEFAULT 1001058,
	`lgpd_ativo` integer DEFAULT false,
	`cnpj` text(14) DEFAULT '',
	`razao_social` text(255) DEFAULT '',
	`atualizada_em` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `configuracoes_tenant_id_unique` ON `configuracoes` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `documentos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant_id` integer NOT NULL,
	`chave_acesso` text(50) NOT NULL,
	`prestador_cnpj` text(14) NOT NULL,
	`operacao_id` integer,
	`nsu` text(20) DEFAULT '',
	`xml_nfse` text DEFAULT '',
	`data_emissao` text(20),
	`emissao_dh` text(30),
	`pdf_blob` blob,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documentos_chave_acesso_unique` ON `documentos` (`chave_acesso`);--> statement-breakpoint
CREATE TABLE `operacoes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant_id` integer NOT NULL,
	`prestador_cnpj` text(14) NOT NULL,
	`tipo` text(20) DEFAULT '',
	`nsu_consultado` text(20),
	`ultimo_nsu` text(20) DEFAULT '',
	`status` text(30) DEFAULT '',
	`qtd_documentos` integer DEFAULT 0,
	`xml_request` text,
	`xml_response` text,
	`xml_erro` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `plan_limits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plano` text(50) NOT NULL,
	`prestadores_max` integer DEFAULT 1 NOT NULL,
	`documentos_mes_max` integer DEFAULT 50 NOT NULL,
	`usuarios_max` integer DEFAULT 2 NOT NULL,
	`lote_zip` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plan_limits_plano_unique` ON `plan_limits` (`plano`);--> statement-breakpoint
CREATE TABLE `prestadores` (
	`cnpj` text(14) NOT NULL,
	`tenant_id` integer NOT NULL,
	`razao_social` text(255) NOT NULL,
	`ambiente` text(20) DEFAULT 'Homologacao' NOT NULL,
	`certificado_pfx` blob,
	`certificado_senha` text(255) NOT NULL,
	`certificado_validade` text(20) DEFAULT '',
	`certificado_nome` text(255) DEFAULT '',
	`created_at` text NOT NULL,
	PRIMARY KEY(`tenant_id`, `cnpj`),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant_id` integer NOT NULL,
	`uuid` text NOT NULL,
	`plano` text(50) DEFAULT 'trial' NOT NULL,
	`status` text(50) DEFAULT 'trialing' NOT NULL,
	`trial_fim` text NOT NULL,
	`periodo_fim` text NOT NULL,
	`gateway_customer_id` text(100),
	`gateway_subscription_id` text(100),
	`cancelado_em` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`asaas_customer_id` text(100),
	`asaas_subscription_id` text(100),
	`documentos_este_mes` integer DEFAULT 0 NOT NULL,
	`documentos_mes_ref` text(7),
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_tenant_id_unique` ON `subscriptions` (`tenant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_uuid_unique` ON `subscriptions` (`uuid`);--> statement-breakpoint
CREATE TABLE `tenant_overrides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant_id` integer NOT NULL,
	`prestadores_max` integer,
	`documentos_mes_max` integer,
	`usuarios_max` integer,
	`lote_zip` integer,
	`updated_at` text NOT NULL,
	`updated_by` integer,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `tenant_usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenant_overrides_tenant_id_unique` ON `tenant_overrides` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `tenant_usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant_id` integer NOT NULL,
	`email` text(255) NOT NULL,
	`senha_hash` text(255) NOT NULL,
	`nome` text(255),
	`papel` text(20) DEFAULT 'operador' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenant_usuarios_email_unique` ON `tenant_usuarios` (`email`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text NOT NULL,
	`tipo` text(2) DEFAULT 'pj' NOT NULL,
	`documento` text(20) DEFAULT '' NOT NULL,
	`nome` text(255) NOT NULL,
	`nome_fantasia` text(255),
	`inscricao_estadual` text(20),
	`email_contato` text(255) DEFAULT '' NOT NULL,
	`telefone_celular` text(20),
	`whatsapp` integer DEFAULT false NOT NULL,
	`telefone_fixo` text(20),
	`cep` text(8),
	`logradouro` text(255),
	`numero` text(20),
	`complemento` text(100),
	`bairro` text(100),
	`cidade` text(100),
	`uf` text(2),
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_uuid_unique` ON `tenants` (`uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_documento_unique` ON `tenants` (`documento`);