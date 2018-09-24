import { CognacContext } from './context'

export interface CognacSourceInterface <T> {
  start: () => Promise<any> | void
  subscribe: (fn: (data: T) => Promise<void>) => void
  stop?: () => Promise<any> | void
  onContextCreate?: (context: CognacContext<T>) => Promise<any> | void
  onDone?: (context: CognacContext<T>) => Promise<any> | void
}
