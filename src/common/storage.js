const ls = localStorage;

export default ({
    get:    (n, d) =>    {
        try {
            return JSON.parse(ls.getItem(n)) || d;
        }
        catch (e) {
            return d;
        }
    },
    set:    (n, v) => ls.setItem(n, JSON.stringify(v)),
    remove: (n) =>    ls.removeItem(n),
    clear:  () =>     ls.clear(),
});
