class MyBoard extends Primitive
{
	constructor(scene, depth)
	{
		super(scene);

		this.winner = "none";

		this.cameraId = "board";

		this.fov = 1.2;
		this.near = 0.1;
		this.far = 500;

		this.cameraAngle = 0;

		this.scene.views[this.cameraId] = new CGFcamera(this.fov, this.near, this.far, vec3.fromValues(0, 5, 15), vec3.fromValues(0, 5, 0));
		this.scene.graph.viewIds.push(this.cameraId);

		this.updateBoard(getPrologRequest("kl", getResponseArray));
		this.previousBoard = this.board;

		this.depth = depth || 0.5;

		this.countdown = 10;

		this.selected = null;

		this.animation = new Animation();

		this.scene.interface.addDifficultyGroup(this);
		this.scene.interface.addGameTypeGroup(this);
		this.scene.interface.addEnvironmentGroup(this);
		this.scene.interface.addUndoButton(this);
		this.scene.interface.addAnimationButton(this);

		this.initBuffers();
	};

	initBuffers()
	{
		this.plane = new Plane(this.scene, 10, 10);

		this.whiteAppearence = new CGFappearance(this.scene);
		this.whiteAppearence.loadTexture("scenes/images/white.png");
		this.whiteAppearence.setAmbient(1.0,1.0,1.0,1);
		this.whiteAppearence.setDiffuse(1.0,1.0,1.0,1);
		this.whiteAppearence.setSpecular(1.0,1.0,1.0,1);
		this.whiteAppearence.setShininess(120);

		this.blackAppearence = new CGFappearance(this.scene);
		this.blackAppearence.loadTexture("scenes/images/black.jpg");
		this.blackAppearence.setAmbient(1.0,1.0,1.0,1);
		this.blackAppearence.setDiffuse(1.0,1.0,1.0,1);
		this.blackAppearence.setSpecular(1.0,1.0,1.0,1);
		this.blackAppearence.setShininess(120);

		this.blueAppearence = new CGFappearance(this.scene);
		this.blueAppearence.loadTexture("scenes/images/blue.png");
		this.blueAppearence.setAmbient(1.0,1.0,1.0,1);
		this.blueAppearence.setDiffuse(1.0,1.0,1.0,1);
		this.blueAppearence.setSpecular(1.0,1.0,1.0,1);
		this.blueAppearence.setShininess(120);

		this.redAppearence = new CGFappearance(this.scene);
		this.redAppearence.loadTexture("scenes/images/red.jpg");
		this.redAppearence.setAmbient(1.0,1.0,1.0,1);
		this.redAppearence.setDiffuse(1.0,1.0,1.0,1);
		this.redAppearence.setSpecular(1.0,1.0,1.0,1);
		this.redAppearence.setShininess(120);

		this.dirt = new CGFappearance(this.scene);
		this.dirt.loadTexture("scenes/images/dirt.jpg");
		this.dirt.setAmbient(1.0,1.0,1.0,1);
		this.dirt.setDiffuse(1.0,1.0,1.0,1);
		this.dirt.setSpecular(1.0,1.0,1.0,1);
		this.dirt.setShininess(120);

		this.piece = new MyPiece(this.scene);

		this.scoreBoard = new ScoreBoard(this.scene);

		this.plays = 0;
		this.playsW = 0;
		this.playsB = 0;
	};

	updateBoard(newBoard)
	{
		this.board = newBoard;
	}

	startAnimation()
	{
		let animations = [new QuadraticBezierAnimation(this.scene, [0, 2, 0], [2, 5, 0], [4, 2, 0], 10)];

		this.scene.graph.components['board'].setAnimations(animations);
	}

	checkWin()
	{
		if (this.winner == "none")
		{
			this.winner = getPrologRequest("game_over");

			if (this.winner != "none")
			{
				this.display();
				window.alert(this.winner + " won!");

				this.selected = null;
				this.possibleMoves = null;
			}
		}
	}

	botLoop()
	{
		if (this.gameType == "Bot vs Bot" && this.winner == "none")
		{
			this.botPlay();

			this.checkWin();
		}
	}

	botPlay()
	{
		if (this.winner == "none")
		{
			setTimeout(() =>
			{
				this.updateBoard(getPrologRequest("moveBot(" + this.plays + "," + (this.scene.difficultyArray.indexOf(this.difficulty)+1) + ")", getResponseArray));

				this.plays++;

				if (this.plays % 2 == 0)
					this.playsW++;
				else
					this.playsB++;

				if (this.gameType == "Bot vs Bot")
					this.botLoop();

			}, 2000);
		}
	}

	getPlayerByColour(colour)
	{
		if (colour == "w")
		{
			return 0;
		}
		else if (colour == "b")
		{
			return 1;
		}
		else
		{
			console.error("Error on colour");
		}
	}

	selectStack(obj)
	{
		if (this.getPlayerByColour(this.board[obj[1]][obj[0]][1]) == this.plays % 2 && this.winner == "none")
		{
			this.selected = obj;
			this.possibleMoves = getPrologRequest("getPieceMoves(" + obj[0] + "," + obj[1] + ")", getResponseArray);
		}
	}

	undoMove()
	{
		if (this.previousBoard != this.board && this.winner == "none" && this.gameType != "Bot vs Bot")
		{
			this.board = this.previousBoard;

			let str = JSON.stringify(this.board).replace(/"/g, "");

			getPrologRequest("setBoard(" + str + ")", getResponse);

			this.selected = null;
			this.possibleMoves = null;

			if (this.gameType == "Player vs Player")
			{
				this.plays--;

				if (this.plays % 2 == 0)
					this.playsB--;
				else
					this.playsW--;
			}
			else if (this.gameType == "Player vs Bot")
			{
				this.plays--;

				if (this.plays % 2 == 0)
					this.playsB--;
				else
					this.playsW--;

				this.plays--;

				if (this.plays % 2 == 0)
					this.playsB--;
				else
					this.playsW--;
			}

			
		}
	}

	logPicking()
	{
		if (this.scene.pickMode == false && this.winner == "none")
		{
			if (this.scene.pickResults != null && this.scene.pickResults.length > 0)
			{
				for (var i=0; i< this.scene.pickResults.length; i++)
				{
					var obj = this.scene.pickResults[i][0];
					if (obj)
					{
						if (this.selected == null)
						{
							this.selectStack(obj);
						}
						else
						{
							if (!this.compareArray(obj, this.selected))
							{
								if (this.findMove(obj) != -1)
								{
									let N;
									if (this.plays == 0 || this.board[this.selected[1]][this.selected[0]][0] == 2)
										N = 1;
									else
									{
										N = window.prompt("Insert number of pieces to move between 1 and " + (this.board[this.selected[1]][this.selected[0]][0] - 1));
										this.scene.interface.processMouseUp(new MouseEvent("mouseup"));
									}

									if (N == null)
									{
										continue;
									}

									if (N > 0 && N < this.board[this.selected[1]][this.selected[0]][0])
									{
										this.previousBoard = this.board;
										this.updateBoard(getPrologRequest("move(" +  this.selected[0] + "," + this.selected[1] + "," + obj[0] + "," + obj[1] + "," + N + ")", getResponseArray));
										this.plays++;

										if (this.plays % 2 == 0)
											this.playsW++;
										else
											this.playsB++;

										this.checkWin();

										this.selected = null;
										this.possibleMoves = null;

										if (this.gameType == "Player vs Bot")
										{
											this.botPlay();

											this.checkWin();
										}
									}
									else
									{
										window.alert("Invalid number of pieces!");
										continue;
									}
								}
								else
								{
									this.selectStack(obj);
								}
							}
							else
							{
								this.selected = null;
								this.possibleMoves = null;
							}
						}

					}
				}

				this.scene.pickResults.splice(0,this.scene.pickResults.length);
			}
		}
	}

	findMove(target)
	{
		for (let i = 0; i < this.possibleMoves.length; i++)
		{
			if (this.compareArray(this.possibleMoves[i], target))
			{
				return i;
			}
		}

		return -1;
	}

	compareArray(a,b)
	{
		if (a.length != b.length)
			return false;

		for (let i = 0; i < a.length; i++)
		{
			if (a[i] != b[i])
				return false;
		}

		return true;
	}

	update(currTime, component)
	{
		this.cameraAngle += 0.02;

		this.scene.views[this.cameraId].fov = this.fov;
		this.scene.views[this.cameraId].near = this.near;
		this.scene.views[this.cameraId].far = this.far;

		this.scene.views[this.cameraId].setPosition(vec3.fromValues(15*Math.cos(this.cameraAngle), 5, 15* Math.sin(this.cameraAngle)));

		if (this.plays > 0 && this.winner == "none")
		{
			this.animation.update(currTime);
		}

	}

	display()
	{
		if(this.environment == "Mountain")
		{
			this.scene.pushMatrix();
			this.scene.translate(14.99,3.6,0);
			this.scene.rotate(Math.PI/2,0,0,1);
			this.scene.rotate(Math.PI/2, 0,1,0);
			this.scene.scale(40,0,8.60);
			this.dirt.apply();
			this.plane.display();
			this.scene.popMatrix();

			this.scene.pushMatrix();
			this.scene.translate(0,-0.39,0);
			this.scene.scale(30,0,30);
			this.dirt.apply();
			this.plane.display();
			this.scene.popMatrix();
		}


		this.logPicking();
		this.scene.clearPickRegistration();
		let id = 1, coords = [], height = this.board.length, width = this.board[0].length;

		this.scene.pushMatrix();

			if (this.possibleMoves != null)
			{
				for (let i = 0; i < this.possibleMoves.length; i++)
				{
					this.scene.pushMatrix();

						this.scene.registerForPick(id, this.possibleMoves[i]);
						id++;

						coords = [(1-height)/2 + this.possibleMoves[i][1], 0, (1-width)/2 + this.possibleMoves[i][0]];
						this.scene.translate(coords[0], 0, coords[2]);

						this.redAppearence.apply();

						this.plane.display();

					this.scene.popMatrix();
				}

			}


			for (let i = 0; i < width; i++)
			{
				for (let j = 0; j < height; j++)
				{
					this.scene.pushMatrix();

						if (this.possibleMoves != null && this.findMove([i,j]) != -1)
						{
							continue;
						}

						if (this.board[j][i][0] > 0)
						{
							this.scene.registerForPick(id, [i,j]);
							id++;
						}
						else
							this.scene.clearPickRegistration();

						coords = [(1-height)/2 + j, 0, (1-width)/2 + i];
						this.scene.translate(coords[0], 0, coords[2]);

						if(this.environment == "Ice")
						{
						if ((i+j)%2 == 0)
							this.whiteAppearence.apply();
						else
							this.blackAppearence.apply();
						}
						else {
							if ((i+j)%2 == 0)
								this.whiteAppearence.apply();
							else
								this.blueAppearence.apply();
						}
						this.plane.display();

						let colour = this.board[j][i][1];


						if(this.environment == 'Ice')
						{
							if (colour == "w")
							{
								this.whiteAppearence.apply();
							}
							else
							{
								this.blueAppearence.apply();
							}
						}
						else
						{
							if (colour == "w")
							{
								this.whiteAppearence.apply();
							}
							else
							{
								this.blackAppearence.apply();
							}
						}

						for (let k = 0; k < this.board[j][i][0]; k++)
						{
							this.scene.pushMatrix();

								this.scene.translate(0, k*(this.piece.height+0.005), 0);

								this.piece.display();

							this.scene.popMatrix();
						}

					this.scene.popMatrix();

				}
			}

			this.scene.clearPickRegistration();

			this.scene.pushMatrix();

				this.scene.translate(height/2, 0, 0);
				this.scene.rotate(-Math.PI/2, 0, 0, 1);
				this.scene.scale(this.depth, 1, width);
				this.scene.translate(0.5, 0, 0);

				this.whiteAppearence.apply();
				this.plane.display();

			this.scene.popMatrix();

			this.scene.pushMatrix();

				this.scene.rotate(Math.PI, 0, 1, 0);
				this.scene.translate(height/2, 0, 0);
				this.scene.rotate(-Math.PI/2, 0, 0, 1);
				this.scene.scale(this.depth, 1, width);
				this.scene.translate(0.5, 0, 0);

				this.whiteAppearence.apply();
				this.plane.display();

			this.scene.popMatrix();

			this.scene.pushMatrix();

				this.scene.translate(0, 0, width/2);
				this.scene.rotate(-Math.PI/2, 0, 1, 0);
				this.scene.rotate(-Math.PI/2, 0, 0, 1);
				this.scene.scale(this.depth, 1, height);
				this.scene.translate(0.5, 0, 0);

				this.whiteAppearence.apply();
				this.plane.display();

			this.scene.popMatrix();

			this.scene.pushMatrix();

				this.scene.rotate(Math.PI, 0, 1, 0);
				this.scene.translate(0, 0, width/2);
				this.scene.rotate(-Math.PI/2, 0, 1, 0);
				this.scene.rotate(-Math.PI/2, 0, 0, 1);
				this.scene.scale(this.depth, 1, height);
				this.scene.translate(0.5, 0, 0);

				this.whiteAppearence.apply();
				this.plane.display();

			this.scene.popMatrix();

			this.scene.pushMatrix();

				this.scene.translate(0, -this.depth, 0);
				this.scene.rotate(Math.PI, 0, 0, 1);
				this.scene.scale(height, 1, width);

				this.whiteAppearence.apply();
				this.plane.display();

			this.scene.popMatrix();

			this.scene.pushMatrix();

				let m = this.animation.sumTime / 60;
				let s = this.animation.sumTime % 60;

				this.scoreBoard.display(this.playsW, this.playsB, m, s);

			this.scene.popMatrix();

		this.scene.popMatrix();
	};
	
};
