PATH := node_modules/.bin:$(PATH)
SHELL := /bin/bash

.PHONY:

all: clean .PHONY
	tsc

configure: .PHONY
	@NODE_ENV= yarn install

clean: .PHONY
	rimraf dist

test: .PHONY
	mocha -r ts-node/register test/spec.ts	

