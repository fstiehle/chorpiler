export const deleteFromArray = (array: Array<any>, key: any) => {
  const index = array.indexOf(key, 0);
  if (index > -1) {
    array.splice(index, 1);
  }
};

export const capitalize = (name: string): string => {
  return name.charAt(0).toUpperCase() + name.slice(1);
};
