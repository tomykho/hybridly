import defu from 'defu'
import type { PartialDeep } from 'type-fest'
import { createContext, RouterContext, RouterContextOptions } from '../src/router/context'
import { VisitPayload } from '../src/types'
import { rest, server } from './server'

export const noop = () => ({} as any)
export const returnsArgs = (...args: any) => args

export function fakeVisitPayload(payload: PartialDeep<VisitPayload> = {}): VisitPayload {
	return defu(payload as VisitPayload, {
		url: 'https://localhost',
		version: 'abc123',
		view: {
			name: 'default.view',
			properties: {},
		},
	})
}

export function makeRouterContextOptions(options: PartialDeep<RouterContextOptions> = {}): RouterContextOptions {
	return defu(options as RouterContextOptions, {
		payload: fakeVisitPayload(),
		adapter: {
			resolveComponent: noop,
			swapDialog: noop,
			swapView: noop,
		},
	})
}

export function fakeRouterContext(options: PartialDeep<RouterContextOptions> = {}): RouterContext {
	return createContext(makeRouterContextOptions(options))
}

/** Mocks a request using MSW. */
export function mockUrl(url: string, options: Partial<MockOptions> = {}) {
	const resolved: MockOptions = defu(options, {
		status: 200,
		headers: { 'x-sleightful': 'true' },
		json: fakeVisitPayload(),
	})

	server.use(rest.get(url, (req, res, ctx) => {
		return res(
			ctx.status(resolved.status),
			...(resolved.headers !== false
				? Object.entries(resolved.headers).map(([key, value]) => ctx.set(key, value))
				: []),
			resolved.body
				? ctx.body(resolved.body)
				: ctx.json(resolved.json),
		)
	}))
}

interface MockOptions {
	status: number
	headers: false | Record<string, any>
	json?: any
	body?: any
}