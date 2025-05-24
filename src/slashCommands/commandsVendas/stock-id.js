const { MessageFlags, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("node:fs");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stock-id")
        .setDescription("Veja o estoque de um produto!")
        .addStringOption(opString => opString
            .setName("id")
            .setDescription("ID do Produto")
            .setMaxLength(25)
            .setAutocomplete(true)
            .setRequired(true)
        ),

    async autocomplete(interaction) {
        const choices = [];
        let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
        if (type?.Vendas?.status !== true) {
            const semPerm = {
                name: "❌ | Comando desabilitado pois o bot não possui o sistema de venda adquirido.",
                value: "no-perms"
            }
            choices.push(semPerm)
            await interaction.respond(
                choices.map(choice => ({ name: choice.name, value: choice.value }))
            )
            return
        }


        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === dono;

        if (!isInDb && !isOwner) {
            const noPermOption = {
                name: "Você não tem permissão para usar este comando!",
                value: "no-perms"
            };
            choices.push(noPermOption);
            await interaction.respond(
                choices.map(choice => ({ name: choice.name, value: choice.value })),
            );
            return;
        }

        for (const product of dbProducts.all()) {
            choices.push({
                name: `ID: ${product.ID} | Nome: ${product.data.name}`,
                value: product.ID,
            });
        };
        choices.sort((a, b) => a.value - b.value);
        const searchId = interaction.options.getString("id");
        if (searchId) {
            const filteredChoices = choices.filter(choice => {
                return choice.value.startsWith(searchId);
            });
            await interaction.respond(
                filteredChoices.map(choice => ({ name: choice.name, value: choice.value })),
            );
        } else {
            const limitedChoices = choices.slice(0, 25);
            await interaction.respond(
                limitedChoices.map(choice => ({ name: choice.name, value: choice.value }))
            );
        };
    },

    async execute(interaction, client) {
        const colorC = await dbConfigs.get(`vendas.embeds.color`)
        let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
        if (type?.Vendas?.status !== true) {
            interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
            return
        }

        const choices = [];

        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === dono;

        if (!isInDb && !isOwner) {
            const noPermOption = {
                name: "Você não tem permissão para usar este comando!",
                value: "no-perms"
            };
            choices.push(noPermOption);
            await interaction.respond(
                choices.map(choice => ({ name: choice.name, value: choice.value })),
            );
            return;
        }

        const idProduct = interaction.options.getString("id");

        if (!dbProducts.has(idProduct)) {
            await interaction.reply({
                content: `❌ | ID do produto: **${idProduct}** não foi encontrado.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        await interaction.reply({
            content: `🔁 | Carregando ...`,
            flags: MessageFlags.Ephemeral
        }).then(async (msg) => {
            const estoqueP = await dbProducts.get(`${idProduct}.stock`);
            if (estoqueP.length <= 0) {
                await interaction.editReply({
                    content: `❌ | Este produto está sem estoque.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            };

            const nameP = await dbProducts.get(`${idProduct}.name`);

            let fileContent = "";
            for (let i = 0; i < estoqueP.length; i++) {
                fileContent += `📦 | ${nameP} - ${i + 1}/${estoqueP.length}:\n${estoqueP[i]}\n\n`;
            };

            const fileName = `${nameP}.txt`;
            fs.writeFile(fileName, fileContent, (err) => {
                if (err) throw err;
            });

            const stockAttachment = new AttachmentBuilder(fileName);

            const embedStock = new EmbedBuilder()
                .setTitle(`Estoque (${idProduct})`)
                .setDescription(`**📦 | Estoque no Arquivo TXT.**`)
                .setColor(colorC !== "none" ? colorC : "#460580")
                .setFooter({ text: `${client.user.username} - Todos os direitos reservados.`, iconURL: client.user.avatarURL() });

            await interaction.editReply({
                content: ``,
                embeds: [embedStock],
                files: [stockAttachment],
                flags: MessageFlags.Ephemeral
            }).then(async (msgEdited) => {

                fs.unlink(fileName, (err) => {
                    if (err) throw err;
                });
            });
        });
    },
};