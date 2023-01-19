export const deleteFromArray = (array: Array<any>, key: any) => {
  const index = array.indexOf(key, 0);
  if (index > -1) {
    array.splice(index, 1);
  }
}

