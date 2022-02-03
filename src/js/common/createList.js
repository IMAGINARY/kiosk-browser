function createList(a) {
  const add = (e) => a.push(e);
  const remove = (e) => {
    const i = a.indexOf(e);
    if (i >= 0) {
      a.splice(i, 1);
    }
  };
  const clear = () => {
    // eslint-disable-next-line no-param-reassign
    a.length = 0;
  };

  return { add, remove, clear };
}

module.exports = createList;
