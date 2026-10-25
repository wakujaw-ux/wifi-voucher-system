export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return alert("Hakuna data ya kupakua");

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // 1. Hii ni amri maalum inayolazimisha Excel kutumia comma (,) kutenganisha
  csvRows.push("sep=,");

  // 2. Weka vichwa vya habari
  csvRows.push(headers.join(","));

  // 3. Weka data
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header] ?? "";
      // Kama ni maandishi (String), weka ndani ya quotes. Kama ni namba, acha wazi.
      if (typeof val === "string") {
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      }
      return val;
    });
    csvRows.push(values.join(","));
  }

  // 4. Pakua faili
  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default exportToCSV;
