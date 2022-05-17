import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import Canvas from 'canvas';

import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions
} from '@sapphire/framework';
import {
  CommandInteraction,
  MessageAttachment,
  MessageEmbed,
  MessageReaction,
  Message,
  User
} from 'discord.js';

@ApplyOptions<CommandOptions>({
  name: 'tic-tac-toe',
  description: `Play a game of Tic-Tac-Toe with another player.`,
  detailedDescription: ` **The Rules**
                Players must get 3 of the same colored squares in a row to win.
                Only one piece is played at a time.
                Players can be on the offensive or defensive.
                The game ends when there is a 3-in-a-row or a stalemate.
                The starter of the previous game goes second on the next game.
                Use the emojis 1️⃣, 2️⃣, 3️⃣ for columns and 🇦, 🇧, 🇨 for rows
                You must click both a number and a letter to place your colored square in that space.
                You have 1 minute per turn or it's an automatic forfeit.
                Incase of invisible board click 🔄 (may take more than one click).`
})
export class TicTacToeCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    const player1 = interaction.user;
    const player2 = interaction.options.getUser('user', true);

    if (player1.id === player2.id) {
      return interaction.reply("Sorry can't play against yourself");
    }
    if (player2.bot) {
      return interaction.reply("Sorry can't play against a bot user");
    }

    const player1Avatar = player1.displayAvatarURL({
      format: 'jpg'
    });

    const player1Piece =
      player1Avatar.length > 0 ? await Canvas.loadImage(player1Avatar) : null;

    const player2Avatar = player2.displayAvatarURL({
      format: 'jpg'
    });
    const player2Piece =
      player1Avatar.length > 0 ? await Canvas.loadImage(player2Avatar!) : null;

    let gameBoard: number[][] = [
      [0, 0, 0], //row 1
      [0, 0, 0],
      [0, 0, 0]
      // column ->
    ];

    let rowChoice: number | null = null;
    let columnChoice: number | null = null;

    const PaginatedEmbed = new PaginatedMessage();
    let currentPlayer = player1.id;
    let boardImageURL: string | null = null;

    let currentTurn = 0;
    await createBoard();
    ++currentTurn;

    const Embed = new MessageEmbed()
      .setThumbnail(player1Avatar)
      .setColor('RED')
      .setTitle(`Tic Tac Toe - Player 1's Turn`)
      .setDescription(
        `Use the emojis 1️⃣, 2️⃣, 3️⃣ for columns and 🇦, 🇧, 🇨 for rows.\n
        You must click both a **Number** and a **Letter** to place your colored square in that space.\n
        You have 1 minute per turn or it's an automatic forfeit.
        Incase of invisible board click 🔄.`
      )
      .addField('Column', 'None', true)
      .addField('Row', 'None', true)
      .setImage(boardImageURL!)
      .setFooter({ text: 'Incase of invisible board click 🔄' })
      .setTimestamp();

    return await PaginatedEmbed.addPageEmbed(Embed)
      .run(interaction)

      .then(async (message: any) => {
        console.log(getProperty(message, 'response'));
        function getProperty<T, K extends keyof T>(o: T, name: K) {
          return o[name];
        }
        try {
          await message.response.react('1️⃣');
          await message.response.react('2️⃣');
          await message.response.react('3️⃣');
          await message.response.react('🇦');
          await message.response.react('🇧');
          await message.response.react('🇨');
          await message.response.react('🔄');
        } catch (error) {
          console.error('One of the emojis failed to react:', error);
        }

        const filter = (reaction: MessageReaction, user: User) => {
          return (
            (reaction.emoji.name === '1️⃣' ||
              reaction.emoji.name === '2️⃣' ||
              reaction.emoji.name === '3️⃣' ||
              reaction.emoji.name === '🇦' ||
              reaction.emoji.name === '🇧' ||
              reaction.emoji.name === '🇨' ||
              reaction.emoji.name === '🔄') &&
            (user.id === player1.id || user.id === player2.id)
          );
        };

        const collector = message.response.createReactionCollector({
          filter: filter,
          idle: 60000
        });
        collector.on(
          'collect',
          async (reaction: MessageReaction, user: User) => {
            // Column 1
            if (reaction.emoji.name === '1️⃣') {
              columnChoice = 0;
              await playerMove(
                rowChoice!,
                columnChoice,
                user,
                message.messages[0].embeds[0]
              );
            }

            // Column 2
            if (reaction.emoji.name === '2️⃣') {
              columnChoice = 1;
              await playerMove(
                rowChoice!,
                columnChoice,
                user,
                message.messages[0].embeds[0]
              );
            }

            // Column 3
            if (reaction.emoji.name === '3️⃣') {
              columnChoice = 2;
              await playerMove(
                rowChoice!,
                columnChoice,
                user,
                message.messages[0].embeds[0]
              );
            }
            // Row A
            if (reaction.emoji.name === '🇦') {
              rowChoice = 0;
              await playerMove(
                rowChoice,
                columnChoice!,
                user,
                message.messages[0].embeds[0]
              );
            }
            // Row B
            if (reaction.emoji.name === '🇧') {
              rowChoice = 1;
              await playerMove(
                rowChoice,
                columnChoice!,
                user,
                message.messages[0].embeds[0]
              );
            }
            // Row C
            if (reaction.emoji.name === '🇨') {
              rowChoice = 2;
              await playerMove(
                rowChoice,
                columnChoice!,
                user,
                message.messages[0].embeds[0]
              );
            }

            // Refresh Image
            if (reaction.emoji.name === '🔄')
              await message.messages[0].embeds[0].setImage(boardImageURL);

            const userReactions = message.response.reactions.cache.filter(
              (reaction: MessageReaction) => reaction.users.cache.has(user.id)
            );

            try {
              for (const reaction of userReactions.values()) {
                await reaction.users.remove(user.id);
              }
            } catch (error) {
              console.error;
            }

            return await message.response.edit({
              embeds: [message.messages[0].embeds[0]]
            });
          }
        );

        collector.on('end', () => {
          if (currentPlayer == 'Game Over') {
            message.response.reactions
              .removeAll()
              .catch((error: string) =>
                console.error('Failed Removing Reactions', error)
              );
          }
        });
      });

    async function createBoard() {
      // Set asset sizes
      const boardHeight = 700;
      const boardWidth = 700;
      const pieceSize = 150;

      // Set Image size
      const canvas = Canvas.createCanvas(boardWidth, boardHeight);
      const ctx = canvas.getContext('2d');

      // Get Center to Center measurements for grid spacing
      const positionX = 200;
      const positionY = 200;

      // Tic-Tac-Toe Board
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, boardWidth, boardHeight);

      ctx.font = '100px Open Sans Light';
      ctx.fillStyle = 'grey';
      // Add Shadows to indicators and empty spaces
      ctx.shadowColor = 'white';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 2;
      // Column Numbers
      ctx.fillText('1', 40, 650);
      ctx.fillText('2', 250, 650);
      ctx.fillText('3', 450, 650);
      // Row Letters
      ctx.fillText('A', 575, 110);
      ctx.fillText('B', 575, 310);
      ctx.fillText('C', 575, 510);

      // Build the Game Board
      for (let columnIndex = 0; columnIndex < 3; ++columnIndex) {
        for (let rowIndex = 0; rowIndex < 3; ++rowIndex) {
          ctx.beginPath();

          // Empty Spaces
          if (gameBoard[rowIndex][columnIndex] === 0) {
            ctx.fillStyle = 'grey';
            ctx.fillRect(
              positionX * columnIndex,
              positionY * rowIndex,
              pieceSize,
              pieceSize
            );
          }

          // Player 1 Pieces
          if (gameBoard[rowIndex][columnIndex] === 1) {
            if (player1Piece) {
              ctx.drawImage(
                player1Piece,
                positionX * columnIndex,
                positionY * rowIndex,
                pieceSize,
                pieceSize
              );
            } else {
              ctx.fillStyle = 'red';
              ctx.shadowColor = 'grey';
              ctx.shadowBlur = 5;
              ctx.shadowOffsetX = 4;
              ctx.shadowOffsetY = 2;
              ctx.fillRect(
                positionX * columnIndex,
                positionY * rowIndex,
                pieceSize,
                pieceSize
              );
            }
          }
          // Player 2 Pieces
          if (gameBoard[rowIndex][columnIndex] === 2) {
            if (player2Piece) {
              ctx.drawImage(
                player2Piece,
                positionX * columnIndex,
                positionY * rowIndex,
                pieceSize,
                pieceSize
              );
            } else {
              ctx.fillStyle = 'blue';
              ctx.shadowColor = 'grey';
              ctx.shadowBlur = 5;
              ctx.shadowOffsetX = 4;
              ctx.shadowOffsetY = 2;
              ctx.fillRect(
                positionX * columnIndex,
                positionY * rowIndex,
                pieceSize,
                pieceSize
              );
            }
          }
        }
      }

      await interaction.channel
        ?.send({
          files: [
            new MessageAttachment(
              canvas.toBuffer(),
              `TicTacToe-${player1.id}-${player2.id}${currentTurn}.png`
            )
          ]
        })
        .then(async (result: Message) => {
          boardImageURL = await result.attachments.entries().next().value[1]
            .url;

          await result.delete();
        })
        .catch((err: string) => {
          if (err) {
            console.log(err);
          }
        });
    }
    async function playerMove(
      row: number,
      column: number,
      user: User,
      instance: MessageEmbed
    ) {
      const rowsLetters = ['A', 'B', 'C'];
      if (currentPlayer === user.id) {
        if (column) instance.fields[0].value = column.toString();
        if (row) instance.fields[1].value = rowsLetters[row];
      }
      // Wait for both
      if (row === null || column === null) {
        return;
      }

      // Reset 'Column' & 'Row' for next turn
      instance.fields[0].value = 'None';
      instance.fields[1].value = 'None';
      columnChoice = null;
      rowChoice = null;
      if (currentPlayer === 'Game Over' || gameBoard[row][column] !== 0) return;
      if (currentPlayer === user.id) {
        if (currentPlayer === player1.id) {
          gameBoard[row][column] = 1;
          currentPlayer = player2.id;
          instance
            .setThumbnail(player2Avatar!)
            .setTitle(`Tic Tac Toe - Player 2's Turn`)
            .setColor('BLUE')
            .setTimestamp();
        } else {
          gameBoard[row][column] = 2;
          currentPlayer = player1.id;
          instance
            .setThumbnail(player1Avatar)
            .setTitle(`Tic Tac Toe - Player 1's Turn`)
            .setColor('RED')
            .setTimestamp();
        }
        await createBoard();
        ++currentTurn;
      } else {
        return interaction.followUp({
          content: `:x: It's Still ${user}'s turn.`,
          ephemeral: true,
          fetchReply: true,
          target: user
        });
      }
      if (checkWinner(gameBoard) === 0) {
        // No More Possible Moves
        if (!emptySpaces(gameBoard)) {
          instance
            .setTitle(`Tic Tac Toe - Game Over`)
            .setColor('GREY')
            .setThumbnail('');
          currentPlayer = 'Game Over';
          // message.guild.gameData.tictactoePlayers.delete(player1.id);
          // message.guild.gameData.tictactoePlayers.delete(player2.id);
        }
        instance.setImage(boardImageURL!).setTimestamp();
        return;
      } else {
        instance
          .setImage(boardImageURL!)
          .setTitle(
            `Tic Tac Toe - 👑 Player ${checkWinner(gameBoard)} Wins! 👑`
          )
          .setTimestamp();
        if (currentPlayer === player1.id) {
          instance.setThumbnail(player2Avatar!).setColor('BLUE');
        } else {
          instance.setThumbnail(player1Avatar).setColor('RED');
        }
        currentPlayer = 'Game Over';
        //   message.guild.gameData.tictactoePlayers.delete(player1.id);
        //   message.guild.gameData.tictactoePlayers.delete(player2.id);
        return;
      }
    }

    // Check for available spaces
    function emptySpaces(board: number[][]) {
      let result = false;
      for (let columnIndex = 0; columnIndex < 3; ++columnIndex) {
        for (let rowIndex = 0; rowIndex < 3; ++rowIndex) {
          if (board[columnIndex][rowIndex] == 0) {
            result = true;
          }
        }
      }
      return result;
    }

    // Check for Win Conditions
    function checkLine(a: number, b: number, c: number) {
      // Check first cell non-zero and all cells match
      return a != 0 && a == b && a == c;
    }

    function checkWinner(board: number[][]) {
      // Check down
      for (let c = 0; c < 3; c++)
        if (checkLine(board[0][c], board[1][c], board[2][c]))
          return board[0][c];

      // Check right
      for (let r = 0; r < 3; r++)
        if (checkLine(board[r][0], board[r][1], board[r][2]))
          return board[r][0];

      // Check down-right
      if (checkLine(board[0][0], board[1][1], board[2][2])) return board[0][0];

      // Check down-left
      if (checkLine(board[0][2], board[1][1], board[2][0])) return board[0][2];

      return 0;
    }
  }
  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: 'USER',
          required: true,
          name: 'user',
          description: `Who would you like to play against?`
        }
      ]
    });
  }
}
