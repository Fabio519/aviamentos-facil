const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const uri = process.env.DATABASE_URL; // O link que você colocou no Render
const client = new MongoClient(uri);

app.use(express.urlencoded({ extended: true }));

// Função para corrigir vírgula
function numero(valor) {
  if (!valor) return 0;
  return parseFloat(valor.toString().replace(",", ".")) || 0;
}

// Estilo CSS compartilhado para todas as páginas
const meuEstilo = `
<style>
  body { font-family: Arial; background: #f0f2f5; margin: 0; padding: 10px; }
  .container { max-width: 950px; margin: auto; background: white; padding: 20px; margin-top: 20px; border-radius: 12px; box-shadow: 0 0 10px #ccc; }
  h1, h2 { text-align: center; color: #1976d2; }
  input { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
  button { padding: 10px; background: #1976d2; color: white; border: none; border-radius: 5px; cursor: pointer; }
  table { width: 100%; margin-top: 20px; border-collapse: collapse; }
  th { background: #1976d2; color: white; padding: 10px; }
  td { padding: 10px; border: 1px solid #ddd; text-align: center; }
  .total { font-weight: bold; color: #1976d2; }
  .btn-voltar { background: #666; text-decoration: none; padding: 10px; color: white; border-radius: 5px; display: inline-block; }
  @media (max-width: 768px) { input, button { width: 100%; margin: 5px 0; } }
</style>
`;

async function start() {
  try {
    await client.connect();
    const db = client.db("aviamentos_db");
    const colecao = db.collection("itens");

    // Página principal
    app.get("/", async (req, res) => {
      const busca = req.query.busca || "";
      const filtro = busca ? { 
        $or: [
          { nome: { $regex: busca, $options: "i" } },
          { fornecedor: { $regex: busca, $options: "i" } }
        ] 
      } : {};

      const rows = await colecao.find(filtro).sort({ nome: 1 }).toArray();

      res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aviamentos Fácil</title>
    ${meuEstilo}
</head>
<body>
    <div class="container">
        <h1>Aviamentos Fácil</h1>
        <form method="GET">
            <input name="busca" placeholder="Buscar..." value="${busca}">
            <button type="submit">Buscar</button>
            <a href="/" class="btn-voltar">Início</a>
        </form>
        <hr>
        <form method="POST" action="/add">
            <input name="nome" placeholder="Nome" required>
            <input name="largura" placeholder="Largura">
            <input name="fornecedor" placeholder="Fornecedor">
            <input name="preco" placeholder="Preço">
            <input name="tingimento" placeholder="Tingimento">
            <button style="background:#2e7d32">Adicionar</button>
        </form>
        <table>
            <tr><th>Nome</th><th>Largura</th><th>Fornecedor</th><th>Preço</th><th>Tingimento</th><th>Total</th><th>Ações</th></tr>
            ${rows.map(item => {
                const p = numero(item.preco);
                const t = numero(item.tingimento);
                return `
                <tr>
                    <td>${item.nome}</td>
                    <td>${item.largura || "-"}</td>
                    <td>${item.fornecedor || "-"}</td>
                    <td>R$ ${p.toFixed(2)}</td>
                    <td>${t > 0 ? "R$ " + t.toFixed(2) : "-"}</td>
                    <td class="total">R$ ${(p + t).toFixed(2)}</td>
                    <td>
                        <a href="/edit/${item._id}">Editar</a> |
                        <a href="/delete/${item._id}" onclick="return confirm('Excluir?')">Excluir</a>
                    </td>
                </tr>`;
            }).join("")}
        </table>
    </div>
</body>
</html>`);
    });

    // Adicionar
    app.post("/add", async (req, res) => {
      await colecao.insertOne({
        nome: req.body.nome,
        largura: req.body.largura,
        fornecedor: req.body.fornecedor,
        preco: numero(req.body.preco),
        tingimento: numero(req.body.tingimento)
      });
      res.redirect("/");
    });

    // Tela de Edição (Agora com Layout Bonito)
    app.get("/edit/:id", async (req, res) => {
      const item = await colecao.findOne({ _id: new ObjectId(req.params.id) });
      if (!item) return res.redirect("/");

      res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Item</title>
    ${meuEstilo}
</head>
<body>
    <div class="container">
        <h2>Editar Aviamento</h2>
        <form method="POST">
            <input name="nome" value="${item.nome}" required>
            <input name="largura" value="${item.largura || ""}">
            <input name="fornecedor" value="${item.fornecedor || ""}">
            <input name="preco" value="${item.preco || ""}">
            <input name="tingimento" value="${item.tingimento || ""}">
            <button type="submit">Salvar Alterações</button>
            <a href="/" class="btn-voltar">Cancelar</a>
        </form>
    </div>
</body>
</html>`);
    });

    // Salvar Edição
    app.post("/edit/:id", async (req, res) => {
      await colecao.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: {
            nome: req.body.nome,
            largura: req.body.largura,
            fornecedor: req.body.fornecedor,
            preco: numero(req.body.preco),
            tingimento: numero(req.body.tingimento)
        }}
      );
      res.redirect("/");
    });

    // Excluir
    app.get("/delete/:id", async (req, res) => {
      await colecao.deleteOne({ _id: new ObjectId(req.params.id) });
      res.redirect("/");
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => console.log("Servidor Online com MongoDB!"));

  } catch (err) {
    console.error("Erro ao conectar no banco:", err);
  }
}

start();