import Canvas from 'canvas';
import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  container
} from '@sapphire/framework';
import {
  CommandInteraction,
  MessageAttachment,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  User,
  MessageComponentInteraction,
  CacheType,
  GuildBasedChannel,
  Interaction
} from 'discord.js';

@ApplyOptions<CommandOptions>({
  name: 'cards',
  description: 'Generate playing cards'
})
export class CardsCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    const { client } = container;
    const interactionsArray: MessageComponentInteraction<CacheType>[] = [];
    const playerMap: Map<string, Player> = new Map();
    const ids: string[] = [];
    const player1 = interaction.user;
    if (client.gameData.cardsPlayers.has(player1.id)) {
      interaction.reply("You can't play more than 1 game at a time");
      return;
    }

    const numberOfCards = interaction.options.getNumber('number-of-cards');
    playerMap.forEach(player => {
      client.gameData.cardsPlayers.set(player.user.id, player.user);
      ids.push(player.user.id);
    });
    let cardImageURL: string | undefined;

    const gameInvite = new MessageEmbed()
      .setAuthor({
        name: player1.username,
        iconURL: interaction.user.avatar
          ? interaction.user.displayAvatarURL()
          : interaction.user.defaultAvatarURL
      })
      .setTitle('Cards - Game Invitation')
      .setColor('YELLOW')
      .setThumbnail(
        'https://www.stickertalk.com/wp-content/uploads/2017/08/D-30-555-set-of-aces-cards.jpg'
      )
      .setDescription(
        `${player1} would like to play a game of Cards. Click Yes or No. if you want to join in`
      )
      .addField('Players', 'None', true)
      .setFooter({ text: 'Invite will expire in 60 seconds' })
      .setTimestamp();

    const gameInviteButtons = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId(`${interaction.id}${ids.join('-')}-Yes`)
        .setLabel('Yes')
        .setStyle('SUCCESS'),
      new MessageButton()
        .setCustomId(`${interaction.id}${ids.join('-')}-No`)
        .setLabel('No')
        .setStyle('DANGER'),
      new MessageButton()
        .setCustomId(`${interaction.id}${ids.join('-')}-Start`)
        .setLabel('Start')
        .setStyle('PRIMARY')
    );

    await interaction
      .reply({
        embeds: [gameInvite],
        components: [gameInviteButtons],
        fetchReply: true
      })
      .then(async i => {
        const inviteCollector =
          interaction.channel?.createMessageComponentCollector({
            time: 60 * 1000
          });
        inviteCollector?.on('collect', async response => {
          if (response.customId === `${interaction.id}${ids.join('-')}-No`) {
            client.gameData.cardsPlayers.delete(response.user.id);
            playerMap.delete(response.user.id);
          }

          if (response.customId === `${interaction.id}${ids.join('-')}-Yes`) {
            if (client.gameData.cardsPlayers.has(response.user.id)) {
              interaction.followUp({
                content: `You are already playing a game is already playing`,
                ephemeral: true
              });
              return;
            }
            if (!playerMap.has(response.user.id)) {
              playerMap.set(response.user.id, {
                user: response.user,
                hand: []
              });
              interactionsArray.push(response);
            }
          }
          const accepted: User[] = [];
          playerMap.forEach(player => accepted.push(player.user));
          await response.update({
            embeds: [
              gameInvite.setFields([
                {
                  name: 'Players',
                  value: `${accepted.length > 0 ? accepted : 'None'}`,
                  inline: true
                }
              ])
            ]
          });
          if (response.customId === `${interaction.id}${ids.join('-')}-Start`) {
            if (accepted.length > 1) return inviteCollector.stop('start-game');
          }
        });
        inviteCollector?.on('end', async (collected, reason) => {
          console.log(reason);
          // console.log(collected);
          await interaction.deleteReply()!;
          if (playerMap.size === 1 || reason === 'declined') {
            playerMap.forEach(value =>
              client.gameData.cardsPlayers.delete(value.user.id)
            );
          }
          if (reason === 'time') {
            await interaction.followUp({
              content: `:x: no one responded to your invitation.`,
              ephemeral: true,
              target: player1
            });
            if (playerMap.size > 1) return inviteCollector.stop('start-game'); // @@TODO remove after dev/testing
          }
          if (reason === 'start-game' || playerMap.size > 1) {
            console.log('collected');
            const imageChannel = await manageAssetsChannel(interaction);

            dealCards(playerMap, numberOfCards ?? 5);

            playerMap.forEach(async (player, index) => {
              await renderCards(player, imageChannel as GuildBasedChannel);
              const Embed = new MessageEmbed()
                .setThumbnail(player.user.displayAvatarURL({ dynamic: false }))
                .setColor('DARKER_GREY')
                .setAuthor({
                  name: player.user.username,
                  iconURL: player.user.displayAvatarURL()
                })
                .setTitle(`Your Cards`)
                .setDescription('Testing generated Cards')
                .setImage(cardImageURL!)
                .setFooter({
                  text: 'Incase of invisible board click 🔄'
                })
                .setTimestamp();

              client.gameData.cardsPlayers.delete(player.user.id); //@TODO remove after testing

              const buttonArray: MessageActionRow[][] = [
                [new MessageActionRow()]
              ];

              let rowCount: number = 0;
              let buttonCount: number = 0;
              let componentCount: number = 0;

              player.hand.forEach(card => {
                if (rowCount == 4 && buttonCount == 5) {
                  componentCount++;
                  rowCount = 0;
                  buttonArray[componentCount] = [new MessageActionRow()];
                  buttonCount = 0;
                }
                if (buttonCount == 5) {
                  rowCount++;
                  buttonArray[componentCount][rowCount] =
                    new MessageActionRow();
                  buttonCount = 0;
                }

                buttonCount++;
                buttonArray[componentCount][rowCount].addComponents(
                  new MessageButton()
                    .setLabel(`${card.value}${card.suit}`)
                    .setCustomId(
                      `${card.value}${card.suit}-${player.user.id}-${buttonCount}`
                    )
                    .setStyle(
                      card.suit == '♦️' || card.suit == '♥️'
                        ? 'DANGER'
                        : 'SECONDARY'
                    )
                );
              });
              console.log(buttonArray);
              interactionsArray.forEach(async button => {
                if (player.user.id == button.user.id)
                  await button
                    .followUp({
                      content: 'this a secret message',
                      embeds: [Embed],
                      components: buttonArray[0],
                      ephemeral: true,
                      fetchReply: true
                    })
                    .then(async y => {
                      console.log();
                      if (componentCount > 0)
                        await button.followUp({
                          components: buttonArray[1],
                          ephemeral: true
                        });
                    });
              });
            });
          }
          return;
        });
      });
    async function manageAssetsChannel(interaction: Interaction) {
      let category = interaction.guild?.channels.cache.find(
        c =>
          c.name.toLowerCase() === 'game-assets' && c.type === 'GUILD_CATEGORY'
      );
      let imageChannel = interaction.guild?.channels.cache.find(
        c => c.name.toLowerCase() === 'game-assets' && c.isText()
      );

      if (!category)
        category = await interaction.guild?.channels.create('game-assets', {
          type: 'GUILD_CATEGORY',
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: ['VIEW_CHANNEL']
            }
          ]
        });

      if (!imageChannel && category) {
        imageChannel = (await interaction.guild?.channels
          .create('game-assets', {
            type: 'GUILD_TEXT',
            parent: category?.id,
            topic: `a private place for game assets like images generated for ${client.application}`,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: ['VIEW_CHANNEL']
              }
            ]
          })
          .catch(error => {
            console.log('cards ', error);
            interaction.channel?.send('sending');
            imageChannel = interaction.channel as GuildBasedChannel;
          })) as GuildBasedChannel;
      }
      return imageChannel;
    }

    function dealCards(players: Map<string, Player>, numOfCards: number) {
      let cardDeck: Card[] = [];
      const numberOfDecks = Math.floor((players.size * numOfCards) % 52);

      for (let i = 0; i < numberOfDecks; i++) {
        let cardDeck2 = getDeck();
        cardDeck2.forEach(card => cardDeck.push(card));
      }

      cardDeck = shuffle(cardDeck!);
      players.forEach(player => {
        for (let c = 0; c < numOfCards; c++) {
          const cardDealt = cardDeck[0];
          player.hand.push(cardDealt);
          cardDeck.shift();
        }
      });
    }
    async function renderCards(
      player: Player,
      imageChannel: GuildBasedChannel
    ) {
      let hand = player.hand;
      hand.sort((a: Card, b: Card) => {
        return b.suit.localeCompare(a.suit) || a.value.localeCompare(b.value); //@@TODO not perfect (AJQK are alphabetical)
      });
      // const avatar = await Canvas.loadImage(
      //   player.user.displayAvatarURL({ format: 'jpg' }) ??
      //     player.user.defaultAvatarURL
      // );

      // Set asset sizes (playing Cards are on AVG 55.9mm X 87.1mm)
      const cardHeight = 871;
      const cardWidth = 559;
      const offSet = 200;
      // const avatarSize = 300;

      // Set Image size
      const canvas = Canvas.createCanvas(
        cardWidth + hand.length * offSet,
        cardHeight
      );

      const ctx = canvas.getContext('2d');
      ctx.antialias = 'subpixel';
      // ctx.textAlign = 'center';
      // ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'black';
      ctx.shadowOffsetX = -15;

      let count: number = 0;
      for (const card of hand) {
        // Card Background

        ctx.fillStyle = '#808080';
        ctx.strokeStyle = 'black';
        ctx.imageSmoothingEnabled = true;

        roundedRect(
          ctx,
          count == 0 ? 0 : count * offSet,
          0,
          cardWidth,
          cardHeight,
          30
        );
        ctx.save(); // save current frame
        //new settings
        ctx.shadowColor = 'transparent';
        ctx.font = '100px arial';
        ctx.fillStyle =
          card.suit == '♦️' || card.suit == '♥️' ? 'red' : 'black';
        ctx.fillText(
          `${card.value}\n${card.suit}`,
          count == 0 ? 30 : 30 + count * offSet,
          100,
          200
        );
        ctx.strokeText(
          `${card.value}\n${card.suit}`,
          count == 0 ? 30 : 30 + count * offSet,
          100,
          200
        );

        // bottom right corner alignment
        if (count == hand.length - 1)
          if (card.value.length == 1) {
            ctx.fillText(
              `${card.value}`,
              count == 0 ? cardWidth - 95 : cardWidth - 95 + count * offSet,
              cardHeight - 35,
              200
            );
            ctx.strokeText(
              `${card.value}`,
              count == 0 ? cardWidth - 95 : cardWidth - 95 + count * offSet,
              cardHeight - 35,
              200
            );
          } else {
            ctx.fillText(
              `${card.value}`,
              count == 0 ? cardWidth - 155 : cardWidth - 155 + count * offSet,
              cardHeight - 40,
              200
            );
            ctx.strokeText(
              `${card.value}`,
              count == 0 ? cardWidth - 155 : cardWidth - 155 + count * offSet,
              cardHeight - 40,
              200
            );
          }
        const cardHorizontal = cardWidth / 2 - 210;

        ctx.font = '300px ariel';
        ctx.fillText(
          card.suit,
          count == 0 ? cardHorizontal : cardHorizontal + count * offSet,
          cardHeight / 2 + 100,
          500
        );
        ctx.strokeText(
          card.suit,
          count == 0 ? cardHorizontal : cardHorizontal + count * offSet,
          cardHeight / 2 + 100,
          500
        );
        // ctx.beginPath();
        // ctx.save();

        // ctx.arc(
        //   count == 0 ? cardHorizontal : cardHorizontal + count * offSet,
        //   cardHeight / 2 + 100,
        //   avatarSize,
        //   0,
        //   Math.PI * 2,
        //   true
        // );
        // ctx.fillStyle = 'grey';
        // ctx.fill();
        // ctx.clip();
        // ctx.drawImage(
        //   avatar,
        //   count == 0 ? cardHorizontal : cardHorizontal + count * offSet,
        //   cardHeight / 2 + 100,
        //   avatarSize * 2,
        //   avatarSize * 2
        // );
        ctx.restore();

        count++;
      }
      const file = new MessageAttachment(canvas.toBuffer(), `cards.png`);

      if (imageChannel?.isText())
        return await imageChannel
          .send({
            files: [file]
          })
          .then(async result => {
            cardImageURL = await result.attachments.entries().next().value[1]
              .url;
            // console.log(cardImageURL);
            result.delete();
          })
          .catch((error: string) => {
            console.error('Cards - Failed to Delete previous Image\n', error);
          });
    }

    // Create a Full Deck of Cards
    function getDeck() {
      const suits = ['♠️', '♦️', '♣️', '♥️'];
      const values = [
        'A',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        'J',
        'Q',
        'K'
      ];
      let deck: Card[] = new Array();

      for (let i = 0; i < suits.length; i++) {
        for (let x = 0; x < values.length; x++) {
          let card = { value: values[x], suit: suits[i] };
          deck.push(card);
        }
      }

      return deck;
    }
    function shuffle(deck: Card[]) {
      for (let i = 0; i < 2000; i++) {
        let i = Math.floor(Math.random() * deck.length);
        let x = Math.floor(Math.random() * deck.length);
        let temp = deck[i];

        deck[i] = deck[x];
        deck[x] = temp;
      }
      return deck;
    }
    function roundedRect(
      ctx: Canvas.CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) {
      ctx.beginPath();
      ctx.moveTo(x, y + radius);
      ctx.lineTo(x, y + height - radius);
      ctx.arcTo(x, y + height, x + radius, y + height, radius);
      ctx.lineTo(x + width - radius, y + height);
      ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
      ctx.lineTo(x + width, y + radius);
      ctx.arcTo(x + width, y, x + width - radius, y, radius);
      ctx.lineTo(x + radius, y);
      ctx.arcTo(x, y, x, y + radius, radius);
      ctx.stroke();
      ctx.fill();
    }

    interface Card {
      value: string;
      suit: string;
    }
    interface Player {
      user: User;
      hand: Card[];
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
          type: 'NUMBER',
          required: false,
          name: 'number-of-cards',
          description: `How many cards would you like to pe dealt?`
        }
      ]
    });
  }
}
