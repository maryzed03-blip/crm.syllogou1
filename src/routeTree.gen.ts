/* eslint-disable */
// @ts-nocheck
// Generated-compatible route tree. TanStack will regenerate this file on dev/build.

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as ArxeiaRouteImport } from './routes/arxeia'
import { Route as ErgasiesRouteImport } from './routes/ergasies'
import { Route as GrammateiaRouteImport } from './routes/grammateia'
import { Route as ImerologioRouteImport } from './routes/imerologio'
import { Route as KartelesRouteImport } from './routes/karteles'
import { Route as MeliRouteImport } from './routes/meli'
import { Route as CrmRouteImport } from './routes/crm'
import { Route as OikonomikaRouteImport } from './routes/oikonomika'
import { Route as SeminariaRouteImport } from './routes/seminaria'
import { Route as ApiCalendarApproveRouteImport } from './routes/api/calendar-approve'
import { Route as ApiCalendarRegistrationsRouteImport } from './routes/api/calendar-registrations'
import { Route as ApiCalendarPaymentDeclarationsRouteImport } from './routes/api/calendar-payment-declarations'
import { Route as ApiSendNewsletterRouteImport } from './routes/api/send-newsletter'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const ArxeiaRoute = ArxeiaRouteImport.update({ id: '/arxeia', path: '/arxeia', getParentRoute: () => rootRouteImport } as any)
const ErgasiesRoute = ErgasiesRouteImport.update({ id: '/ergasies', path: '/ergasies', getParentRoute: () => rootRouteImport } as any)
const GrammateiaRoute = GrammateiaRouteImport.update({ id: '/grammateia', path: '/grammateia', getParentRoute: () => rootRouteImport } as any)
const ImerologioRoute = ImerologioRouteImport.update({ id: '/imerologio', path: '/imerologio', getParentRoute: () => rootRouteImport } as any)
const KartelesRoute = KartelesRouteImport.update({ id: '/karteles', path: '/karteles', getParentRoute: () => rootRouteImport } as any)
const CrmRoute = CrmRouteImport.update({ id: '/crm', path: '/crm', getParentRoute: () => rootRouteImport } as any)
const MeliRoute = MeliRouteImport.update({ id: '/meli', path: '/meli', getParentRoute: () => rootRouteImport } as any)
const OikonomikaRoute = OikonomikaRouteImport.update({ id: '/oikonomika', path: '/oikonomika', getParentRoute: () => rootRouteImport } as any)
const SeminariaRoute = SeminariaRouteImport.update({ id: '/seminaria', path: '/seminaria', getParentRoute: () => rootRouteImport } as any)
const ApiCalendarApproveRoute = ApiCalendarApproveRouteImport.update({ id: '/api/calendar-approve', path: '/api/calendar-approve', getParentRoute: () => rootRouteImport } as any)
const ApiCalendarRegistrationsRoute = ApiCalendarRegistrationsRouteImport.update({ id: '/api/calendar-registrations', path: '/api/calendar-registrations', getParentRoute: () => rootRouteImport } as any)
const ApiCalendarPaymentDeclarationsRoute = ApiCalendarPaymentDeclarationsRouteImport.update({ id: '/api/calendar-payment-declarations', path: '/api/calendar-payment-declarations', getParentRoute: () => rootRouteImport } as any)
const ApiSendNewsletterRoute = ApiSendNewsletterRouteImport.update({ id: '/api/send-newsletter', path: '/api/send-newsletter', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/arxeia': typeof ArxeiaRoute
  '/ergasies': typeof ErgasiesRoute
  '/grammateia': typeof GrammateiaRoute
  '/imerologio': typeof ImerologioRoute
  '/karteles': typeof KartelesRoute
  '/crm': typeof CrmRoute
  '/meli': typeof MeliRoute
  '/oikonomika': typeof OikonomikaRoute
  '/seminaria': typeof SeminariaRoute
  '/api/calendar-approve': typeof ApiCalendarApproveRoute
  '/api/calendar-registrations': typeof ApiCalendarRegistrationsRoute
  '/api/calendar-payment-declarations': typeof ApiCalendarPaymentDeclarationsRoute
  '/api/send-newsletter': typeof ApiSendNewsletterRoute
}
export interface FileRoutesByTo extends FileRoutesByFullPath {}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/arxeia': typeof ArxeiaRoute
  '/ergasies': typeof ErgasiesRoute
  '/grammateia': typeof GrammateiaRoute
  '/imerologio': typeof ImerologioRoute
  '/karteles': typeof KartelesRoute
  '/crm': typeof CrmRoute
  '/meli': typeof MeliRoute
  '/oikonomika': typeof OikonomikaRoute
  '/seminaria': typeof SeminariaRoute
  '/api/calendar-approve': typeof ApiCalendarApproveRoute
  '/api/calendar-registrations': typeof ApiCalendarRegistrationsRoute
  '/api/calendar-payment-declarations': typeof ApiCalendarPaymentDeclarationsRoute
  '/api/send-newsletter': typeof ApiSendNewsletterRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: keyof FileRoutesByFullPath
  fileRoutesByTo: FileRoutesByTo
  to: keyof FileRoutesByTo
  id: keyof FileRoutesById
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  ArxeiaRoute: typeof ArxeiaRoute
  ErgasiesRoute: typeof ErgasiesRoute
  GrammateiaRoute: typeof GrammateiaRoute
  ImerologioRoute: typeof ImerologioRoute
  KartelesRoute: typeof KartelesRoute
  CrmRoute: typeof CrmRoute
  MeliRoute: typeof MeliRoute
  OikonomikaRoute: typeof OikonomikaRoute
  SeminariaRoute: typeof SeminariaRoute
  ApiCalendarApproveRoute: typeof ApiCalendarApproveRoute
  ApiCalendarRegistrationsRoute: typeof ApiCalendarRegistrationsRoute
  ApiCalendarPaymentDeclarationsRoute: typeof ApiCalendarPaymentDeclarationsRoute
  ApiSendNewsletterRoute: typeof ApiSendNewsletterRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/arxeia': { id: '/arxeia'; path: '/arxeia'; fullPath: '/arxeia'; preLoaderRoute: typeof ArxeiaRouteImport; parentRoute: typeof rootRouteImport }
    '/ergasies': { id: '/ergasies'; path: '/ergasies'; fullPath: '/ergasies'; preLoaderRoute: typeof ErgasiesRouteImport; parentRoute: typeof rootRouteImport }
    '/grammateia': { id: '/grammateia'; path: '/grammateia'; fullPath: '/grammateia'; preLoaderRoute: typeof GrammateiaRouteImport; parentRoute: typeof rootRouteImport }
    '/imerologio': { id: '/imerologio'; path: '/imerologio'; fullPath: '/imerologio'; preLoaderRoute: typeof ImerologioRouteImport; parentRoute: typeof rootRouteImport }
    '/karteles': { id: '/karteles'; path: '/karteles'; fullPath: '/karteles'; preLoaderRoute: typeof KartelesRouteImport; parentRoute: typeof rootRouteImport }
    '/crm': { id: '/crm'; path: '/crm'; fullPath: '/crm'; preLoaderRoute: typeof CrmRouteImport; parentRoute: typeof rootRouteImport }
    '/meli': { id: '/meli'; path: '/meli'; fullPath: '/meli'; preLoaderRoute: typeof MeliRouteImport; parentRoute: typeof rootRouteImport }
    '/oikonomika': { id: '/oikonomika'; path: '/oikonomika'; fullPath: '/oikonomika'; preLoaderRoute: typeof OikonomikaRouteImport; parentRoute: typeof rootRouteImport }
    '/seminaria': { id: '/seminaria'; path: '/seminaria'; fullPath: '/seminaria'; preLoaderRoute: typeof SeminariaRouteImport; parentRoute: typeof rootRouteImport }
    '/api/calendar-approve': { id: '/api/calendar-approve'; path: '/api/calendar-approve'; fullPath: '/api/calendar-approve'; preLoaderRoute: typeof ApiCalendarApproveRouteImport; parentRoute: typeof rootRouteImport }
    '/api/calendar-registrations': { id: '/api/calendar-registrations'; path: '/api/calendar-registrations'; fullPath: '/api/calendar-registrations'; preLoaderRoute: typeof ApiCalendarRegistrationsRouteImport; parentRoute: typeof rootRouteImport }
    '/api/calendar-payment-declarations': { id: '/api/calendar-payment-declarations'; path: '/api/calendar-payment-declarations'; fullPath: '/api/calendar-payment-declarations'; preLoaderRoute: typeof ApiCalendarPaymentDeclarationsRouteImport; parentRoute: typeof rootRouteImport }
    '/api/send-newsletter': { id: '/api/send-newsletter'; path: '/api/send-newsletter'; fullPath: '/api/send-newsletter'; preLoaderRoute: typeof ApiSendNewsletterRouteImport; parentRoute: typeof rootRouteImport }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute,
  ArxeiaRoute,
  ErgasiesRoute,
  GrammateiaRoute,
  ImerologioRoute,
  KartelesRoute,
  CrmRoute,
  MeliRoute,
  OikonomikaRoute,
  SeminariaRoute,
  ApiCalendarApproveRoute,
  ApiCalendarRegistrationsRoute,
  ApiCalendarPaymentDeclarationsRoute,
  ApiSendNewsletterRoute,
}

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
