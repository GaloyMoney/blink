"use client"
import React, { Suspense, useEffect } from "react"
import Card from "react-bootstrap/Card"
import Col from "react-bootstrap/Col"
import Container from "react-bootstrap/Container"
import Jumbotron from "react-bootstrap/Jumbotron"
import ListGroup from "react-bootstrap/ListGroup"
import Row from "react-bootstrap/Row"
import { gql, useQuery } from "@apollo/client"

import { useRouter } from "next/navigation"

import CurrencyDropdown from "../components/currency/currency-dropdown"
import { getClientSideGqlConfig } from "../config/config"

const GET_NODE_STATS = gql`
  query nodeIds {
    globals {
      nodesIds
    }
  }
`

function Home() {
  const nodeUrl = getClientSideGqlConfig().coreGqlUrl.includes("staging")
    ? `https://mempool.space/signet/lightning/node/`
    : `https://mempool.space/lightning/node/`
  const { loading, error, data } = useQuery(GET_NODE_STATS)
  const [selectedDisplayCurrency, setSelectedDisplayCurrency] =
    React.useState<string>("USD")

  useEffect(() => {
    const displayCurrency = localStorage.getItem("display")
    if (displayCurrency) {
      setSelectedDisplayCurrency(displayCurrency)
    }
  }, [])

  const router = useRouter()
  const [username, setUsername] = React.useState<string>("")

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push(`${username}?display=${selectedDisplayCurrency}`, { scroll: true })
  }

  return (
    <Container>
      <br />
      <Row>
        <Col>
          <h2>Connect to the Blink Node</h2>
          <br />
          <Jumbotron>
            <Container>
              <Row>
                <Col>
                  <Card>
                    <Card.Body>
                      <ListGroup variant="flush">
                        <ListGroup.Item>
                          <label>Node Public Key: </label>{" "}
                          <p
                            data-testid="node-pubkey-txt"
                            style={{ fontSize: "small", overflowWrap: "break-word" }}
                          >
                            {error
                              ? "Unavailable"
                              : loading
                                ? "Loading..."
                                : data.globals.nodesIds[0]}
                          </p>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          {error ? (
                            "Unavailable"
                          ) : loading ? (
                            "Loading..."
                          ) : (
                            <a href={nodeUrl + `${data.globals.nodesIds[0]}`}>
                              Connect the Blink node
                            </a>
                          )}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <form
                            className="username-form"
                            autoComplete="off"
                            onSubmit={(event: React.FormEvent<HTMLFormElement>) =>
                              handleSubmit(event)
                            }
                          >
                            <label htmlFor="username">
                              To use the <strong>POS</strong> app, enter your blink (BBW)
                              username
                            </label>
                            <input
                              data-testid="username-txt"
                              type="text"
                              name="username"
                              value={username}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                setUsername(event.target.value)
                              }
                              placeholder="username"
                              required
                            />
                            <label htmlFor="display" style={{ alignSelf: "flex-start" }}>
                              Enter your currency
                            </label>
                            <Suspense>
                              <CurrencyDropdown
                                name="display"
                                style={{ height: "42px", width: "100%" }}
                                onSelectedDisplayCurrencyChange={(newDisplayCurrency) => {
                                  if (newDisplayCurrency) {
                                    localStorage.setItem("display", newDisplayCurrency)
                                    setSelectedDisplayCurrency(newDisplayCurrency)
                                  }
                                }}
                              />
                            </Suspense>
                            <button data-testid="submit-btn">Submit</button>
                          </form>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <hr />
            </Container>
          </Jumbotron>
        </Col>
      </Row>
    </Container>
  )
}

export default Home
