import express from 'express'
import cors from 'cors'
import { Prisma, PrismaClient } from '@prisma/client'
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minute'
import { convertMinuteStringToHour } from './utils/convert-minute-string-to-hour'

const app = express()

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
	log: ['query']
})

app.get('/games', async (request, response) => {
	const games = await prisma.game.findMany({
		include: {
			_count: {
				select: {
					ads: true,
				}
			}
		}
	})

	return response.json(games)
})

app.post('/games/:id/ads', async (request, response) => {
	const gameId = request.params.id
	const body = request.body

	const ad = await prisma.ad.create({
		data: {
			gameId,
			name: body.name,
			yearsPlanning: body.yearsPlanning,
			discord: body.discord,
			weekDays: body.weekDays.join(','),
			startHours: convertHourStringToMinutes(body.startHours),
			endHours: convertHourStringToMinutes(body.endHours),
			useVoiceChannel: body.useVoiceChannel,
		}
	})


	return response.status(201).json(ad)
})

app.get('/games/:id/ads', async (request, response) => {
	const gameId = request.params.id

	const ads = await prisma.ad.findMany({
		select: {
			id: true,
			name: true,
			weekDays: true,
			useVoiceChannel: true,
			yearsPlanning: true,
			startHours: true,
			endHours: true,
		},
		where: {
			gameId,
		},
		orderBy: {
			createdAt: 'desc',
		}
	})

	return response.json(ads.map(ad => {
		return {
			...ad,
			weekDays: ad.weekDays.split(','),
			startHours: convertMinuteStringToHour(ad.startHours),
			endHours: convertMinuteStringToHour(ad.endHours)
		}
	}))
})

app.get('/ads/:id/discord', async (request, response) => {
	const adId = request.params.id

	const ad = await prisma.ad.findUniqueOrThrow({
		select: {
			discord: true,
		},
		where: {
			id: adId,
		}
	})

	return response.json({
		discord: ad.discord,
	})
})

app.listen(3333)