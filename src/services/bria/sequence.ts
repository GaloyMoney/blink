export const SequenceRepo = () => {
  let local_sequence = 0

  const updateSequence = (sequence: number) => {
    local_sequence = sequence
  }
  const getSequence = async (): Promise<number | Error> => {
    return local_sequence
  }
  return {
    updateSequence,
    getSequence,
  }
}
