package com.unimag.emitix.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import jakarta.annotation.PostConstruct;

@Configuration
public class FlywayConfig {

    @Autowired
    private DataSource dataSource;

    @PostConstruct
    public void migrate() {
        System.out.println("====== STARTING MANUAL FLYWAY MIGRATION ======");
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .load();
        flyway.migrate();
        System.out.println("====== FINISHED MANUAL FLYWAY MIGRATION ======");
    }
}
