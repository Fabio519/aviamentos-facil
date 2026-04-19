const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const db = new sqlite3.Database("aviamentos.db");

app.use(express.urlencoded({ extended: true }));

// Função para corrigir vírgula
function numero(valor) {
  if (!valor) return 0;
  return parseFloat(
    valor.toString().replace(",", ".")
  ) || 0;
}

// Criar tabela
db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS aviamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      largura TEXT,
      fornecedor TEXT,
      preco REAL,
      tingimento REAL
    )
  `);

});

// Página principal com BUSCA
app.get("/", (req, res) => {

  const busca = req.query.busca || "";

 db.all(
  `SELECT * FROM aviamentos
   WHERE LOWER(nome) LIKE LOWER(?)
   OR LOWER(fornecedor) LIKE LOWER(?)
   ORDER BY LOWER(nome) ASC`,
  [`%${busca}%`, `%${busca}%`],
  (err, rows) => {

    res.send(`

<!DOCTYPE html>
<html>

<head>

<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Aviamentos Fácil</title>

<style>

body {
  font-family: Arial;
  background: #f0f2f5;
}

.container {
  width: 950px;
  margin: auto;
  background: white;
  padding: 20px;
  margin-top: 40px;
  border-radius: 12px;
  box-shadow: 0 0 10px #ccc;
  overflow-x: auto;
}

h1 {
  text-align: center;
  color: #1976d2;
}

input {
  padding: 8px;
  margin: 5px;
}

button {
  padding: 10px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 5px;
}

button:hover {
  background: #0d47a1;
}

table {
  width: 100%;
  margin-top: 20px;
  border-collapse: collapse;
}

th {
  background: #1976d2;
  color: white;
}

td, th {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: center;
}

.total {
  font-weight: bold;
  color: #1976d2;
}
/* Responsivo para celular */
@media (max-width: 768px) {

.container {
  width: 95%;
}

table {
  font-size: 12px;
}

input {
  width: 90%;
}

button {
  width: 95%;
  margin-top: 5px;
}

}
@media (max-width: 768px) {

.container {
  width: 95%;
}

input {
  width: 95%;
}

button {
  width: 95%;
}

}
</style>

</head>

<body>

<div class="container">

<h1>Aviamentos Fácil</h1>

<br>



<br>

<!-- BUSCA -->

<form method="GET">

<input 
name="busca" 
placeholder="Buscar por nome ou fornecedor"
value="${busca}">

<button type="submit">
Buscar
</button>

<a href="/">
<button type="button">
Início
</button>
</a>

</form>

<!-- CADASTRO -->

<form method="POST" action="/add">

<input name="nome" placeholder="Nome" required>

<input name="largura" placeholder="Largura">

<input name="fornecedor" placeholder="Fornecedor">

<input name="preco" placeholder="Preço">

<input name="tingimento" placeholder="Tingimento">

<button>
Adicionar
</button>

</form>

<table>

<tr>
<th>Nome</th>
<th>Largura</th>
<th>Fornecedor</th>
<th>Preço</th>
<th>Tingimento</th>
<th>Total</th>
<th>Ações</th>
</tr>

${rows.map(item => {

const preco = numero(item.preco);
const ting = numero(item.tingimento);
const total = preco + ting;

return `

<tr>

<td>${item.nome}</td>

<td>${item.largura || "-"}</td>

<td>${item.fornecedor || "-"}</td>

<td>R$ ${preco.toFixed(2)}</td>

<td>
${ting > 0 ? "R$ " + ting.toFixed(2) : "-"}
</td>

<td class="total">
R$ ${total.toFixed(2)}
</td>

<td>

<a href="/edit/${item.id}">
Editar
</a>

<a href="/delete/${item.id}">
Excluir
</a>

</td>

</tr>

`;

}).join("")}

</table>

</div>

</body>

</html>

`);

    }

  );

});

// Adicionar
app.post("/add", (req, res) => {

  const preco = numero(req.body.preco);
  const tingimento = numero(req.body.tingimento);

  db.run(
    `INSERT INTO aviamentos
     (nome, largura, fornecedor, preco, tingimento)
     VALUES (?, ?, ?, ?, ?)`,
    [
      req.body.nome,
      req.body.largura,
      req.body.fornecedor,
      preco,
      tingimento
    ]
  );

  res.redirect("/");

});

// Excluir
app.get("/delete/:id", (req, res) => {

  db.run(
    `DELETE FROM aviamentos WHERE id=?`,
    [req.params.id]
  );

  res.redirect("/");

});

// Editar
app.get("/edit/:id", (req, res) => {

  db.get(
    `SELECT * FROM aviamentos WHERE id=?`,
    [req.params.id],
    (err, item) => {

res.send(`

<!DOCTYPE html>
<html>

<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>

body {
  font-family: Arial;
  background: #f0f2f5;
}

.container {
  width: 500px;
  max-width: 95%;
  margin: auto;
  background: white;
  padding: 20px;
  margin-top: 50px;
  border-radius: 12px;
}

input {
  padding: 8px;
  margin: 5px;
  width: 90%;
}

button {
  padding: 10px;
  background: #1976d2;
  color: white;
  border: none;
}

.inicio {
  padding: 10px 15px;
  background: #6c757d;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  display: inline-block;
  margin-bottom: 10px;
}

.inicio:hover {
  background: #495057;
}
 

</style>

</head>

<body>

<div class="container">

<h2>Editar Item</h2>

<form method="POST">

<input name="nome" value="${item.nome}">

<input name="largura" value="${item.largura}">

<input name="fornecedor" value="${item.fornecedor}">

<input name="preco" value="${item.preco}">

<input name="tingimento" value="${item.tingimento}">

<button>
Salvar
</button>

</form>

</div>

</body>

</html>

`);

    }
  );

});

// Salvar edição
app.post("/edit/:id", (req, res) => {

  const preco = numero(req.body.preco);
  const tingimento = numero(req.body.tingimento);

  db.run(
    `UPDATE aviamentos
     SET nome=?, largura=?, fornecedor=?, preco=?, tingimento=?
     WHERE id=?`,
    [
      req.body.nome,
      req.body.largura,
      req.body.fornecedor,
      preco,
      tingimento,
      req.params.id
    ]
  );

  res.redirect("/");

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor online na porta ${PORT}`);
});