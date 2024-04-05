type NonError<T> = T extends Error ? never : T
