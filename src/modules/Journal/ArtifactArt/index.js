import Image from 'next/image'

import { art } from '@/game/content/assets'

const images = {
  waystone: '/art/symbols/gimli/stone.webp',
  seal: '/art/symbols/elrond/seal.webp',
  brightSeal: '/art/symbols/celebrimbor/sigil.webp',
  dominion: '/art/symbols/sauron/oneRing.webp',
  ember: '/art/symbols/gandalf/flame.webp',
  westStar: '/art/symbols/aragorn/star.webp',
  mountainKey: '/art/symbols/bilbo/key.webp',
  crown: '/art/symbols/thorin/crown.webp',
}

const ArtifactArt = ({ id, className }) => (
  <Image
    className={className}
    src={images[id] || art.symbolFallback}
    alt=""
    width={96}
    height={96}
  />
)

export default ArtifactArt
