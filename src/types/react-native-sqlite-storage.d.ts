declare module 'react-native-sqlite-storage' {
  interface SQLiteDatabase {
    executeSql(sql: string, params?: any[]): Promise<[any]>
    close(): Promise<void>
  }

  interface SQLiteParams {
    name: string
    version?: string
    displayName?: string
    size?: number
  }

  const SQLite: {
    DEBUG: boolean
    enablePromise(enable: boolean): void
    openDatabase(params: SQLiteParams): Promise<SQLiteDatabase>
  }

  export default SQLite
}

