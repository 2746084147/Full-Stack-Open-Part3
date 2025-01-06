require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

app.use(express.static('dist'))
app.use(express.json())
app.use(cors())

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

// const unkonwnEndpoint = (request, response) => {
//   response.status(404).send({error:"unknown endpoint"})
// }
// app.use(unkonwnEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  if(error.name === 'CastError'){
    return response.status(400).send({error:'malformatted id'})
  } else if (error.name === 'ValidationError'){
    return response.status(400).json({error:error.message})
  }
  next(error)
}
app.use(errorHandler)

app.get('/info', (request, response) => {
  const time = new Date()
  Person.countDocuments({}).then(count => {
    response.send(`
      <p>Phonebook has info for ${count} people.</p>
      <p>${time}</p>
    `)
  })

})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if(person){
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      console.log('delete success');
      
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response) => {
  // request.body === the item sent from the frontend.
  const body = request.body

  // First check if the name is empty:
  if(body.name === undefined){
    return response.status(400).json({
      error:'name missing'
    })
  } else if (!body.number){
    return response.status(400).json({
      error:'number missing'
    })
  }
  // if(Person.find({name:body.name})){
  //   return response.status(400).json({
  //     error:'name must be unique'
  //   })
  // }
  const person = new Person({
    name: body.name,
    number: body.number
  })
  person.save().then(savePerson => {
    response.json(savePerson)
  })
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body
  const person = {
    name: body.name,
    number: body.number,
  }
  Person.findByIdAndUpdate(
    request.params.id, 
    person, 
    {new: true, runValidators: true, context: 'query'}
  )
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
