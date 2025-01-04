const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const app = express()

app.use(express.json())
app.use(cors())
app.use(express.static('dist'))

let persons = [
  {
    "id": 1,
    "name": "Arto Hellas",
    "number": "040-123456"
  },
  {
    "id": 2,
    "name": "Ada Lovelace",
    "number": "39-44-5323523"
  },
  {
    "id": 3,
    "name": "Dan Abramov",
    "number": "12-43-234345"
  },
  {
    "id": 4,
    "name": "Mary Poppendieck",
    "number": "39-23-6423122"
  }
]

const generateId = () => {
  const maxId = persons.length > 0 ? Math.max(...persons.map(n => n.id)) : 0
  return maxId + 1
}

const logRequestBody = (tokens, request, response) => {
  return [
    tokens.method(request, response),
    tokens.url(request, response),
    tokens.status(request, response),
    tokens.res(request, response, 'content-length'),
    '-',
    tokens['response-time'](request, response), 'ms',
    'Payload', JSON.stringify(request.body)
  ].join(' ')
}
app.use(morgan(logRequestBody))

app.get('/info', (request, response) => {
  const time = new Date()
  response.send(`
    <p>Phonebook has info for ${persons.length} people.</p>
    <p>${time}</p>
    `)
})

app.get('/api/persons', (request, response) => {
  response.json(persons)
})

app.get('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)

  // code in the material:
  const person = persons.find(e=>e.id === id)
  if(person){
    response.json(person)
  } else {
    response.status(404).end()
  }

  // my code:
  // This has some bugs when a deletion happens, it will return 200 which is wrong.
  // if(id > persons.length){
  //   response.status(404).end()
  // } else {
  //   response.json(persons.find(e=>e.id === id))
  // }
  
})

app.delete('/api/persons/:id', (request, response) => {
  const id = +request.params.id
  persons = persons.filter(e => e.id !== id)
  response.status(204).end()
})

app.post('/api/persons', (request, response) => {
  // request.body === the item sent from the frontend.
  const body = request.body
  // console.log(body.name);
  
  // First check if the name is empty:
  if(!body.name){
    return response.status(400).json({
      error:'name missing'
    })
  } else if (!body.number){
    return response.status(400).json({
      error:'number missing'
    })
  }
  if(persons.find(e=>e.name === body.name)){
    return response.status(400).json({
      error:'name must be unique'
    })
  }
  const person = {
    "id": generateId(),
    "name": body.name,
    "number": body.number || ''
  }
  persons = persons.concat(person)
  response.json(person)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
