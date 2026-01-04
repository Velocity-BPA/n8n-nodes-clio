/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 */

import { Clio } from '../../nodes/Clio/Clio.node';
import { ClioTrigger } from '../../nodes/Clio/ClioTrigger.node';

describe('Clio Node', () => {
	let clioNode: Clio;

	beforeEach(() => {
		clioNode = new Clio();
	});

	it('should have correct node name', () => {
		expect(clioNode.description.name).toBe('clio');
	});

	it('should have correct display name', () => {
		expect(clioNode.description.displayName).toBe('Clio');
	});

	it('should have required credentials', () => {
		expect(clioNode.description.credentials).toBeDefined();
		expect(clioNode.description.credentials).toHaveLength(1);
		expect(clioNode.description.credentials![0].name).toBe('clioOAuth2Api');
	});

	it('should have all 16 resources defined', () => {
		const resourceProperty = clioNode.description.properties.find(
			(p) => p.name === 'resource'
		);
		expect(resourceProperty).toBeDefined();
		expect(resourceProperty?.options).toHaveLength(16);
	});

	it('should include matters resource', () => {
		const resourceProperty = clioNode.description.properties.find(
			(p) => p.name === 'resource'
		);
		const resourceOptions = resourceProperty?.options as { value: string }[];
		const matterResource = resourceOptions?.find((o) => o.value === 'matters');
		expect(matterResource).toBeDefined();
	});

	it('should include contacts resource', () => {
		const resourceProperty = clioNode.description.properties.find(
			(p) => p.name === 'resource'
		);
		const resourceOptions = resourceProperty?.options as { value: string }[];
		const contactsResource = resourceOptions?.find((o) => o.value === 'contacts');
		expect(contactsResource).toBeDefined();
	});
});

describe('ClioTrigger Node', () => {
	let clioTrigger: ClioTrigger;

	beforeEach(() => {
		clioTrigger = new ClioTrigger();
	});

	it('should have correct node name', () => {
		expect(clioTrigger.description.name).toBe('clioTrigger');
	});

	it('should have correct display name', () => {
		expect(clioTrigger.description.displayName).toBe('Clio Trigger');
	});

	it('should be a trigger node', () => {
		expect(clioTrigger.description.group).toContain('trigger');
	});

	it('should have webhook configuration', () => {
		expect(clioTrigger.description.webhooks).toBeDefined();
		expect(clioTrigger.description.webhooks).toHaveLength(1);
	});

	it('should have events property', () => {
		const eventsProperty = clioTrigger.description.properties.find(
			(p) => p.name === 'events'
		);
		expect(eventsProperty).toBeDefined();
		expect(eventsProperty?.type).toBe('multiOptions');
	});

	it('should have webhook methods defined', () => {
		expect(clioTrigger.webhookMethods).toBeDefined();
		expect(clioTrigger.webhookMethods.default).toBeDefined();
		expect(clioTrigger.webhookMethods.default.checkExists).toBeDefined();
		expect(clioTrigger.webhookMethods.default.create).toBeDefined();
		expect(clioTrigger.webhookMethods.default.delete).toBeDefined();
	});
});
