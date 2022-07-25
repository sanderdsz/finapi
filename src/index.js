const express = require('express');
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json()); 

const customers = [];

/* Middleware */
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find(
    (customer) => customer.cpf === cpf
  );

  if (!customer) {
    return response.status(400).json({
      error: "Customer not found",
    });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      console.log(acc)
      return acc + operation.amount;
    }
    console.log(acc)
    return acc - operation.amount;
  }, 0);
  return balance;
}

/**
 * cpf - string
 * name - string
 * id - uuid 
 * statement []
 */
app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({
      error: "Customer already exists",
    });
  }

  const id = uuidv4();
  customers.push({
    cpf,
    name,
    id,
    statement: []
  });

  return response.status(201).send();
});

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});


app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customers.indexOf(customer), 1);

  return response.status(200).json(customers);
});

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer.statement);
});

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response)=> {
  const { customer } = request;
  const { date }  = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
      (statement) =>
        statement.createdAt.toDateString() === 
        new Date(dateFormat).toDateString()
  );

return response.json(statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;
  
  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type:"credit"
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({
      error: "Insufficient funds",
    });
  }

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type:"debit"
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.listen(3333);
console.log('Server started on port 3333');