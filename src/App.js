import React, { Component } from 'react';
import Board from './Board';
import AddPlayerForm from './AddPlayerForm';
import PlayingField from './PlayingField';
import StatusBar from './StatusBar';

class Scoreboard extends Component {
    constructor (props) {
        super(props);

        this.state = {
            currentPlayer: null,
            players: [],
            formValue: '',
            gameStart: false,
            gameStatus: '',
            playerId: 0
        };

        this.handleAddPlayer = this.handleAddPlayer.bind(this);
        this.onFormInput = this.onFormInput.bind(this);
        this.handleScoreUpdate = this.handleScoreUpdate.bind(this);
        this.handleRemovePlayer = this.handleRemovePlayer.bind(this);
        this.handleStartGame = this.handleStartGame.bind(this);
        this.handlePlayerTurn = this.handlePlayerTurn.bind(this);
        this.confirmPlayerAction = this.confirmPlayerAction.bind(this);
        this.getNextPlayer = this.getNextPlayer.bind(this);
        this.resetTurnsTaken = this.resetTurnsTaken.bind(this);
        this.checkPlayerHits = this.checkPlayerHits.bind(this);
        this.endOfRound = this.endOfRound.bind(this);
        this.reduceHealth = this.reduceHealth.bind(this);
    }

    render () {
        return (
			<div>
				<div className="scoreboard">
                    <div className="header">
                        <table className="stats">
                            <tbody>
                                <tr>
                                    <td>Players:</td>
                                    <td>{this.state.players.length}</td>
                                </tr>
                                <tr>
                                    <td>Total Kills:</td>
                                    <td>tbc</td>
                                </tr>
                            </tbody>
                        </table>
                        <h1>Scoreboard</h1>
                    </div>
					<Board
						players={this.state.players}
                        currentPlayer={this.state.players}
                        handleScoreUpdate={this.handleScoreUpdate}
                        handleRemovePlayer={this.handleRemovePlayer}
					/>
					<AddPlayerForm
						handleAddPlayer={this.handleAddPlayer}
						onFormInput={this.onFormInput}
						formValue={this.state.formValue}
					/>
				</div>
                <div className="statusbar">
                    <StatusBar
                        handleStartGame={this.handleStartGame}
                        gameStart={this.state.gameStart}
                        players={this.state.players}
                        gameStatus={this.state.gameStatus}
                        currentPlayer={this.state.currentPlayer}
                    />
                </div>
				<div className={`playingField pf-${this.state.players.length}`}>
					<PlayingField
                        players={this.state.players}
                        handlePlayerTurn={this.handlePlayerTurn}
                        gameStart={this.state.gameStart}
                        gameStatus={this.state.gameStatus}
                        currentPlayer={this.state.currentPlayer}
                        confirmPlayerAction={this.confirmPlayerAction}
					/>
				</div>
			</div>
        );
    }

    onFormInput (event) {
        this.setState({
            formValue: event.target.value
        });
    }

    handleAddPlayer (event) {
        // this prevents page refresh, which is what the native HTML Button Element does by default
        event.preventDefault();

        let players = this.state.players;
        let newPlayer = {
            id: this.state.playerId, // change from random number to remove risk of same id
            name: this.state.formValue,
            score: 0,
            turnTaken: false,
            health: 100
        };

        this.setState({
            players: players.concat(newPlayer),
            formValue: '',
            playerId: this.state.playerId + 1
        });

    }

    handleScoreUpdate (playerArrID, buttonType) {

        this.setState({
            players: this.state.players.map(function (player) {
                if (player.id === playerArrID) {
                    player.score += buttonType === 'plus' ? 1 : -1;
                    return player;
                } else {
                    return player;
                }
            })
        });

    }

    handleRemovePlayer (i) {
        this.setState({
            players: this.state.players.filter(function (player, index) {
                return index !== i;
            })
        });
    }

    handleStartGame () {
        // the filthiest lines in this program
        document.querySelector('.addPlayerForm').parentElement.removeChild(document.querySelector('.addPlayerForm'));
        document.querySelector('.startBtn').parentElement.removeChild(document.querySelector('.startBtn'));

        // remove all player buttons
        const playerButtons = document.querySelectorAll('.removePlayerButton');
        playerButtons.forEach(function (playerButton) {
            playerButton.parentElement.removeChild(playerButton);
        });

        this.setState({
            gameStart: true,
            currentPlayer: this.state.players[0],
            gameStatus: 'positioning',
            players: this.state.players.map((player, i) => {
                player.currentPos = i;
                player.targetTile = null;
                return player;
            })
        });
    }

    handlePlayerTurn (i, gameStatus, event) {
        //  change currentPlayer pos in the state
        event.stopPropagation();

        // Copy the currentPlayer state into new variable
        let currentPlayer = Object.assign({}, this.state.currentPlayer);
        currentPlayer.currentPos = gameStatus === 'positioning' ? i : this.state.currentPlayer.currentPos;
        currentPlayer.targetTile = gameStatus === 'positioning' ? null : i;

        this.setState({
            currentPlayer: currentPlayer,
            players: this.state.players.map(function (player) {
                if (currentPlayer.id === player.id) {
                    currentPlayer.turnTaken = true;
                    return currentPlayer;
                }
                return player;
            })
        });
    }

    confirmPlayerAction (currentPlayer, players, gameStatus, event) {
        // this next line is quite cool. the button which fires 'confirmPlayerMove' is a CHILD of the button which handles 'handlePlayerTurn' (in the HTML).
        // Due to event bubbling, whenever an event is triggered a child, it also 'bubbles up' to the parent, causing the parent to fire it's handler,
        // passing in that event. (As if itself was just triggered). This cause a problem because every time we want to confirmPlayerMove,
        // we are also inadvertently calling the handlePlayerTurn handler above, which overwrites the state that was just set in this handler.
        // PHEW! So, in order to stop that bubbling behaviour, we call this native DOM API method.
        event.stopPropagation();

        if (gameStatus === 'positioning') {
            this.setState({ gameStatus: 'firing' });
        } else {
            this.setState({
                gameStatus: 'positioning',
                currentPlayer: this.getNextPlayer()
            });
        }
    }

    getNextPlayer () {
        // checks all players and returns the first player found with turnTaken set to false
        for (const player of this.state.players) {
            if (!player.turnTaken) {
                return player;
            }
        }

        this.endOfRound();

        return this.state.players[0];
    }

    resetTurnsTaken () {
        // resets all turns taken to false
        // resets all targetTiles to null
        this.setState({
            players: this.state.players.map(function (player) {
                player.turnTaken = false;
                player.targetTile = null;
                return player;
            })
        });
    }

    checkPlayerHits () {
        for (const positionPlayer of this.state.players) {
            for (const tilesHitPlayer of this.state.players) {
                if (positionPlayer.currentPos === tilesHitPlayer.targetTile && positionPlayer.id !== tilesHitPlayer.id) {
                    this.reduceHealth(positionPlayer);
                }
            }
        }
    }

    reduceHealth (playerHit) {
        this.setState({
            players: this.state.players.map(function (player) {
                if (playerHit.id === player.id) {
                    playerHit.health -= 10;
                    return playerHit;
                }
                return player;
            })
        });
    }

    endOfRound () {
        this.checkPlayerHits();
        this.resetTurnsTaken();
    }
}

export default Scoreboard;