package com.unimag.emitix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class EmitixApplication {

	public static void main(String[] args) {
		SpringApplication.run(EmitixApplication.class, args);
	}

}
