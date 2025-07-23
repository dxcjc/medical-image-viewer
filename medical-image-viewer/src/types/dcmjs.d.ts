declare module 'dcmjs' {
  export interface DicomDict {
    [key: string]: any
  }

  export interface DataSet {
    elements: { [key: string]: any }
    string(tag: string): string | undefined
    uint16(tag: string): number | undefined
    uint32(tag: string): number | undefined
    floatString(tag: string): string | undefined
    intString(tag: string): string | undefined
  }

  export namespace data {
    export class DicomMessage {
      static readFile(buffer: ArrayBuffer): DicomMessage
      dict: DicomDict
      meta: DicomDict
    }

    export class DicomMetaDictionary {
      static naturalizeDataset(dataset: any): any
    }
  }

  export namespace normalizers {
    export function normalizeToDataset(elements: any): DataSet
  }

  export const log: {
    level: string
    error: (...args: any[]) => void
    warn: (...args: any[]) => void
    info: (...args: any[]) => void
    debug: (...args: any[]) => void
  }
}
